import { NextResponse } from "next/server";
import { requireClientAccess } from "@/lib/core/session";
import { requireEntitlement } from "@/lib/core/entitlements";
import { buildExpedienteZip } from "@/lib/ai-act/export";
import { logAudit } from "@/lib/core/audit";
import { BRAND } from "@/lib/core/i18n";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireClientAccess(id, request.headers);
  if (!access) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Export permitido también en modo solo lectura (past_due).
  const ent = await requireEntitlement(access.ctx.orgId, "ai_act", { allowReadOnly: true });
  if (!ent) return NextResponse.json({ error: "upgrade_required" }, { status: 403 });

  const { filename, buffer } = await buildExpedienteZip(
    access.ctx.orgId,
    access.client,
    BRAND,
  );

  await logAudit({
    orgId: access.ctx.orgId,
    clientCompanyId: id,
    actorUserId: access.ctx.userId,
    actorEmail: access.ctx.email,
    entityType: "export",
    entityId: null,
    action: "generated",
    summary: `Expediente de "${access.client.name}" exportado (ZIP).`,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
