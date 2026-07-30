import { NextResponse } from "next/server";
import { getActiveContext } from "@/lib/core/session";
import { getTrainingForOrg, listAttendees } from "@/lib/ai-act/training";
import { getOrgMeta } from "@/lib/core/org";
import { renderCertificatePDF } from "@/lib/pdf/certificate";
import { BRAND } from "@/lib/core/i18n";
import { logAudit } from "@/lib/core/audit";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await getActiveContext(request.headers);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const found = await getTrainingForOrg(ctx.orgId, id);
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const meta = await getOrgMeta(ctx.orgId);
  const attendees = await listAttendees(id);
  const pdf = await renderCertificatePDF({
    brandName: meta?.brand_name || BRAND,
    logoUrl: meta?.logo_url,
    clientName: found.clientName,
    training: found.training,
    attendees,
    generatedAt: new Date().toISOString(),
  });

  await logAudit({
    orgId: ctx.orgId,
    clientCompanyId: found.clientId,
    actorUserId: ctx.userId,
    actorEmail: ctx.email,
    entityType: "training",
    entityId: id,
    action: "certificate_generated",
    summary: `Certificado de formación "${found.training.title}" generado.`,
  });

  const safeName = found.training.title.replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 60);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificado_${safeName}.pdf"`,
    },
  });
}
