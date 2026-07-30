import { NextResponse } from "next/server";
import { getActiveContext } from "@/lib/core/session";
import { getOrgMeta, setStripeCustomerId } from "@/lib/core/org";
import { getStripe, planFromKey, appUrl } from "@/lib/core/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ctx = await getActiveContext(request.headers);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { plan?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const resolved = planFromKey(body.plan ?? "");
  if (!resolved) return NextResponse.json({ error: "invalid_plan" }, { status: 400 });

  const priceId = process.env[resolved.def.priceEnv];
  if (!priceId) {
    return NextResponse.json({ error: "price_not_configured" }, { status: 500 });
  }

  const stripe = getStripe();
  const meta = await getOrgMeta(ctx.orgId);

  // Reusar customer si ya existe; si no, crearlo y guardarlo.
  let customerId = meta?.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: ctx.email,
      metadata: { orgId: ctx.orgId },
    });
    customerId = customer.id;
    await setStripeCustomerId(ctx.orgId, customerId);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: ctx.orgId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      metadata: {
        orgId: ctx.orgId,
        product: "ai_act",
        plan: resolved.key,
        maxClients: String(resolved.def.maxClients),
      },
    },
    metadata: {
      orgId: ctx.orgId,
      product: "ai_act",
      plan: resolved.key,
      maxClients: String(resolved.def.maxClients),
    },
    success_url: `${appUrl()}/billing?checkout=success`,
    cancel_url: `${appUrl()}/billing?checkout=cancel`,
  });

  return NextResponse.json({ url: session.url });
}
