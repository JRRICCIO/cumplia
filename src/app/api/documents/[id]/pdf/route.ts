import { NextResponse } from "next/server";
import { getActiveContext } from "@/lib/core/session";
import { getDocumentForOrg } from "@/lib/ai-act/documents";
import { getOrgMeta } from "@/lib/core/org";
import { renderDocumentPDF } from "@/lib/pdf/document";
import { BRAND } from "@/lib/core/i18n";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await getActiveContext(request.headers);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const found = await getDocumentForOrg(ctx.orgId, id);
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const meta = await getOrgMeta(ctx.orgId);
  const pdf = await renderDocumentPDF({
    brandName: meta?.brand_name || BRAND,
    logoUrl: meta?.logo_url,
    clientName: found.clientName,
    title: found.doc.title || "Documento",
    contentMd: found.doc.content_md,
    version: found.doc.version,
    status: found.doc.status,
    generatedAt: found.doc.created_at,
  });

  const safeName = (found.doc.title || "documento")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .slice(0, 60);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}_v${found.doc.version}.pdf"`,
    },
  });
}
