import { NextResponse } from "next/server";
import { getActiveContext } from "@/lib/core/session";
import { deleteSystem, getSystemForOrg, listClassifications } from "@/lib/ai-act/systems";
import { logAudit } from "@/lib/core/audit";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await getActiveContext(request.headers);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const found = await getSystemForOrg(ctx.orgId, id);
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const classifications = await listClassifications(id);
  return NextResponse.json({ system: found.system, classifications });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await getActiveContext(request.headers);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const found = await getSystemForOrg(ctx.orgId, id);
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await deleteSystem(found.clientId, id);
  await logAudit({
    orgId: ctx.orgId,
    clientCompanyId: found.clientId,
    actorUserId: ctx.userId,
    actorEmail: ctx.email,
    entityType: "ai_system",
    entityId: id,
    action: "deleted",
    summary: `Sistema de IA "${found.system.name}" eliminado del inventario.`,
  });
  return NextResponse.json({ ok: true });
}
