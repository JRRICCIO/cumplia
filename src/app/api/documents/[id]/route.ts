import { NextResponse } from "next/server";
import { getActiveContext } from "@/lib/core/session";
import { finalizeDocument, getDocumentForOrg } from "@/lib/ai-act/documents";
import { logAudit } from "@/lib/core/audit";

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
  return NextResponse.json({ document: found.doc });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await getActiveContext(request.headers);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const found = await getDocumentForOrg(ctx.orgId, id);
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Único cambio soportado: finalizar (congela el documento).
  if (found.doc.status === "final") {
    return NextResponse.json({ ok: true, alreadyFinal: true });
  }
  await finalizeDocument(found.clientId, id);
  await logAudit({
    orgId: ctx.orgId,
    clientCompanyId: found.clientId,
    actorUserId: ctx.userId,
    actorEmail: ctx.email,
    entityType: "document",
    entityId: id,
    action: "finalized",
    summary: `Documento "${found.doc.title}" finalizado (versión ${found.doc.version}).`,
  });
  return NextResponse.json({ ok: true });
}
