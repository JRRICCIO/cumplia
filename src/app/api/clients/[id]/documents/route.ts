import { NextResponse } from "next/server";
import { requireClientAccess } from "@/lib/core/session";
import { requireEntitlement } from "@/lib/core/entitlements";
import {
  DOC_TYPES,
  gatherContext,
  getActiveTemplate,
  listDocuments,
  saveDocument,
  type DocType,
} from "@/lib/ai-act/documents";
import { generateDocument } from "@/lib/ai-act/generate";
import { logAudit } from "@/lib/core/audit";

export const runtime = "nodejs";
export const maxDuration = 300; // la generación con IA puede tardar

const VALID: DocType[] = DOC_TYPES.map((d) => d.key);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireClientAccess(id, request.headers);
  if (!access) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const documents = await listDocuments(id);
  return NextResponse.json({ documents });
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

  let body: { docType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const docType = body.docType as DocType;
  if (!VALID.includes(docType)) {
    return NextResponse.json({ error: "invalid_doc_type" }, { status: 400 });
  }

  const template = await getActiveTemplate(docType);
  if (!template) {
    return NextResponse.json({ error: "no_template" }, { status: 500 });
  }

  try {
    const ctx = await gatherContext(access.client);
    const gen = await generateDocument(template, ctx);
    const doc = await saveDocument({
      clientId: id,
      docType,
      title: gen.title,
      contentMd: gen.contentMd,
      promptTemplateId: template.id,
      inputSnapshot: gen.inputSnapshot,
      createdBy: access.ctx.email,
    });

    await logAudit({
      orgId: access.ctx.orgId,
      clientCompanyId: id,
      actorUserId: access.ctx.userId,
      actorEmail: access.ctx.email,
      entityType: "document",
      entityId: doc.id,
      action: "generated",
      summary: `Documento "${doc.title}" (${docType}) generado, versión ${doc.version}.`,
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "generation_failed", detail: err instanceof Error ? err.message : "" },
      { status: 502 },
    );
  }
}
