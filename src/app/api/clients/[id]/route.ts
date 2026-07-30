import { NextResponse } from "next/server";
import { requireClientAccess } from "@/lib/core/session";
import { archiveClient } from "@/lib/core/clients";
import { logAudit } from "@/lib/core/audit";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireClientAccess(id, request.headers);
  if (!access) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ client: access.client });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireClientAccess(id, request.headers);
  if (!access) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (access.client.is_self) {
    return NextResponse.json({ error: "cannot_archive_self" }, { status: 400 });
  }

  await archiveClient(access.ctx.orgId, id);
  await logAudit({
    orgId: access.ctx.orgId,
    clientCompanyId: id,
    actorUserId: access.ctx.userId,
    actorEmail: access.ctx.email,
    entityType: "client",
    entityId: id,
    action: "archived",
    summary: `Cliente "${access.client.name}" archivado.`,
  });
  return NextResponse.json({ ok: true });
}
