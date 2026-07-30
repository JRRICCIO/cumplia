import { NextResponse } from "next/server";
import { getActiveContext } from "@/lib/core/session";
import { getOrgMeta, updateOrgBrand } from "@/lib/core/org";
import { uploadFile } from "@/lib/core/storage";

export const runtime = "nodejs";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB para un logo
const ALLOWED = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];

export async function POST(request: Request) {
  const ctx = await getActiveContext(request.headers);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const meta = await getOrgMeta(ctx.orgId);
  if (!meta) return NextResponse.json({ error: "no_org_meta" }, { status: 400 });

  const form = await request.formData();
  const file = form.get("logo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const stored = await uploadFile(
    `orgs/${ctx.orgId}/brand`,
    file.name || "logo",
    buf,
    file.type,
  );
  await updateOrgBrand(ctx.orgId, meta.brand_name, stored.url);
  return NextResponse.json({ ok: true, logoUrl: stored.url });
}
