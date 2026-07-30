import { NextResponse } from "next/server";
import { getActiveContext } from "@/lib/core/session";
import { getOrgMeta, updateOrgBrand } from "@/lib/core/org";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const ctx = await getActiveContext(request.headers);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const meta = await getOrgMeta(ctx.orgId);
  return NextResponse.json({ meta });
}

export async function PATCH(request: Request) {
  const ctx = await getActiveContext(request.headers);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const meta = await getOrgMeta(ctx.orgId);
  if (!meta) return NextResponse.json({ error: "no_org_meta" }, { status: 400 });

  let body: { brandName?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const brandName = (body.brandName ?? "").toString().trim().slice(0, 120) || null;
  await updateOrgBrand(ctx.orgId, brandName, meta.logo_url);
  return NextResponse.json({ ok: true, brandName });
}
