import { NextResponse } from "next/server";
import { getActiveContext } from "@/lib/core/session";
import { getTrainingForOrg } from "@/lib/ai-act/training";
import { createAttachment, listAttachments } from "@/lib/core/attachments";
import { uploadFile } from "@/lib/core/storage";
import { logAudit } from "@/lib/core/audit";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB por evidencia

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await getActiveContext(request.headers);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const found = await getTrainingForOrg(ctx.orgId, id);
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const evidence = await listAttachments("training", id);
  return NextResponse.json({ evidence });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await getActiveContext(request.headers);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const found = await getTrainingForOrg(ctx.orgId, id);
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const stored = await uploadFile(
    `orgs/${ctx.orgId}/clients/${found.clientId}/trainings/${id}`,
    file.name || "evidencia",
    buf,
    file.type || "application/octet-stream",
  );
  const attachment = await createAttachment({
    clientCompanyId: found.clientId,
    entityType: "training",
    entityId: id,
    filename: file.name || "evidencia",
    mime: file.type || null,
    sizeBytes: buf.byteLength,
    blobUrl: stored.url,
  });

  await logAudit({
    orgId: ctx.orgId,
    clientCompanyId: found.clientId,
    actorUserId: ctx.userId,
    actorEmail: ctx.email,
    entityType: "training",
    entityId: id,
    action: "evidence_added",
    summary: `Evidencia "${attachment.filename}" adjuntada a la formación "${found.training.title}".`,
  });

  return NextResponse.json({ attachment }, { status: 201 });
}
