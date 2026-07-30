import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/core/stripe";
import { getSql } from "@/lib/core/db";
import {
  setEntitlementStatusBySubscription,
  upsertPaidEntitlement,
} from "@/lib/core/entitlements";
import { logAudit } from "@/lib/core/audit";

export const runtime = "nodejs";

function tsToIso(ts: number | null | undefined): string | null {
  return ts ? new Date(ts * 1000).toISOString() : null;
}

/** Registra el evento una sola vez (idempotencia). Devuelve true si es nuevo. */
async function markEvent(id: string, type: string): Promise<boolean> {
  const sql = getSql();
  const rows = (await sql`
    insert into stripe_events (id, type) values (${id}, ${type})
    on conflict (id) do nothing
    returning id
  `) as { id: string }[];
  return rows.length > 0;
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 500 });
  }
  const sig = request.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "no_signature" }, { status: 400 });

  const body = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return NextResponse.json(
      { error: "invalid_signature", detail: err instanceof Error ? err.message : "" },
      { status: 400 },
    );
  }

  // Idempotencia: si ya lo procesamos, salir OK.
  const isNew = await markEvent(event.id, event.type);
  if (!isNew) return NextResponse.json({ received: true, duplicate: true });

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.client_reference_id || session.metadata?.orgId;
      const plan = session.metadata?.plan;
      const maxClients = parseInt(session.metadata?.maxClients ?? "1", 10);
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;

      let periodEnd: string | null = null;
      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        periodEnd = tsToIso((sub as unknown as { current_period_end: number }).current_period_end);
      }

      if (orgId && plan) {
        await upsertPaidEntitlement({
          orgId,
          product: "ai_act",
          plan,
          status: "active",
          maxClients: Number.isFinite(maxClients) ? maxClients : 1,
          stripeSubscriptionId: subscriptionId,
          currentPeriodEnd: periodEnd,
        });
        await logAudit({
          orgId,
          entityType: "billing",
          action: "subscription_activated",
          summary: `Suscripción activada (plan ${plan}).`,
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const status =
        sub.status === "active" || sub.status === "trialing"
          ? "active"
          : sub.status === "past_due" || sub.status === "unpaid"
            ? "past_due"
            : sub.status === "canceled"
              ? "canceled"
              : "active";
      await setEntitlementStatusBySubscription(
        sub.id,
        status,
        tsToIso((sub as unknown as { current_period_end: number }).current_period_end),
      );
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await setEntitlementStatusBySubscription(sub.id, "canceled", null);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId =
        typeof (invoice as unknown as { subscription: string | null }).subscription === "string"
          ? (invoice as unknown as { subscription: string }).subscription
          : null;
      if (subId) await setEntitlementStatusBySubscription(subId, "past_due", null);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
