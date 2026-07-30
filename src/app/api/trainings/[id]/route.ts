import { NextResponse } from "next/server";
import { getActiveContext } from "@/lib/core/session";
import { deleteTraining, getTrainingForOrg, listAttendees } from "@/lib/ai-act/training";
import { listAttachments } from "@/lib/core/attachments";
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
  const attendees = await listAttendees(id);
  const evidence = await listAttachments("training", id);
  return NextResponse.json({ training: found.training, attendees, evidence });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await getActiveContext(request.headers);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const found = await getTrainingForOrg(ctx.orgId, id);
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await deleteTraining(found.clientId, id);
  await logAudit({
    orgId: ctx.orgId,
    clientCompanyId: found.clientId,
    actorUserId: ctx.userId,
    actorEmail: ctx.email,
    entityType: "training",
    entityId: id,
    action: "deleted",
    summary: `Formación "${found.training.title}" eliminada del registro.`,
  });
  return NextResponse.json({ ok: true });
}
