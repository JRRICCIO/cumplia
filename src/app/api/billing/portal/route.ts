import { NextResponse } from "next/server";
import { getActiveContext } from "@/lib/core/session";
import { getOrgMeta } from "@/lib/core/org";
import { getStripe, appUrl } from "@/lib/core/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ctx = await getActiveContext(request.headers);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const meta = await getOrgMeta(ctx.orgId);
  if (!meta?.stripe_customer_id) {
    return NextResponse.json({ error: "no_customer" }, { status: 400 });
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: meta.stripe_customer_id,
    return_url: `${appUrl()}/billing`,
  });
  return NextResponse.json({ url: session.url });
}
