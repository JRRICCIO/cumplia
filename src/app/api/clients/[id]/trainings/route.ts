import { NextResponse } from "next/server";
import { requireClientAccess } from "@/lib/core/session";
import { requireEntitlement } from "@/lib/core/entitlements";
import { createTraining, listTrainings } from "@/lib/ai-act/training";
import { logAudit } from "@/lib/core/audit";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireClientAccess(id, request.headers);
  if (!access) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const trainings = await listTrainings(id);
  return NextResponse.json({ trainings });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireClientAccess(id, request.headers);
  if (!access) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const ent = await requireEntitlement(access.ctx.orgId, "ai_act");
  if (!ent) return NextResponse.json({ error: "upgrade_required" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "title_required" }, { status: 400 });

  const dur = Number(body.durationMinutes);
  const training = await createTraining(id, {
    title: title.slice(0, 200),
    description: (body.description as string)?.trim() || null,
    provider: (body.provider as string)?.trim() || null,
    trainingDate: (body.trainingDate as string) || null,
    durationMinutes: Number.isFinite(dur) && dur > 0 ? Math.round(dur) : null,
  });

  await logAudit({
    orgId: access.ctx.orgId,
    clientCompanyId: id,
    actorUserId: access.ctx.userId,
    actorEmail: access.ctx.email,
    entityType: "training",
    entityId: training.id,
    action: "created",
    summary: `Formación en IA "${training.title}" registrada (Art. 4).`,
  });

  return NextResponse.json({ training }, { status: 201 });
}
