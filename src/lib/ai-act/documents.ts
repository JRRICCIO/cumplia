import { getSql } from "@/lib/core/db";
import type { ClientCompany } from "@/lib/core/session";
import type { Obligation } from "./types";

export type DocType = "politica_uso_ia" | "aviso_transparencia" | "clausulas_proveedor";

export const DOC_TYPES: { key: DocType; label: string; desc: string }[] = [
  { key: "politica_uso_ia", label: "Política de uso de IA", desc: "Política interna de uso responsable de IA." },
  { key: "aviso_transparencia", label: "Avisos de transparencia", desc: "Textos del Art. 50 según tus sistemas." },
  { key: "clausulas_proveedor", label: "Cláusulas para proveedores", desc: "Anexo contractual para proveedores de IA." },
];

export interface GeneratedDocument {
  id: string;
  client_company_id: string;
  doc_type: DocType;
  version: number;
  title: string | null;
  content_md: string;
  prompt_template_id: string | null;
  input_snapshot: Record<string, unknown> | null;
  status: "draft" | "final";
  created_by: string | null;
  created_at: string;
  finalized_at: string | null;
}

export interface PromptTemplate {
  id: string;
  doc_type: DocType;
  version: number;
  model: string | null;
  system_prompt: string;
  user_template: string;
  output_schema: Record<string, unknown>;
}

export async function getActiveTemplate(docType: DocType): Promise<PromptTemplate | null> {
  const sql = getSql();
  const rows = (await sql`
    select id, doc_type, version, model, system_prompt, user_template, output_schema
    from prompt_templates
    where doc_type = ${docType} and status = 'active'
    order by version desc limit 1
  `) as PromptTemplate[];
  return rows[0] ?? null;
}

export async function listDocuments(clientId: string): Promise<GeneratedDocument[]> {
  const sql = getSql();
  return (await sql`
    select id, client_company_id, doc_type, version, title, content_md,
           prompt_template_id, input_snapshot, status, created_by, created_at, finalized_at
    from generated_documents
    where client_company_id = ${clientId}
    order by doc_type asc, version desc
  `) as GeneratedDocument[];
}

export async function getDocumentForOrg(
  orgId: string,
  docId: string,
): Promise<{ doc: GeneratedDocument; clientId: string; clientName: string } | null> {
  const sql = getSql();
  const rows = (await sql`
    select d.id, d.client_company_id, d.doc_type, d.version, d.title, d.content_md,
           d.prompt_template_id, d.input_snapshot, d.status, d.created_by,
           d.created_at, d.finalized_at, c.name as client_name
    from generated_documents d
    join client_companies c on c.id = d.client_company_id
    where d.id = ${docId} and c.org_id = ${orgId} and c.archived_at is null
    limit 1
  `) as (GeneratedDocument & { client_name: string })[];
  if (rows.length === 0) return null;
  const { client_name, ...doc } = rows[0];
  return { doc, clientId: doc.client_company_id, clientName: client_name };
}

async function nextVersion(clientId: string, docType: DocType): Promise<number> {
  const sql = getSql();
  const rows = (await sql`
    select coalesce(max(version), 0) + 1 as v
    from generated_documents
    where client_company_id = ${clientId} and doc_type = ${docType}
  `) as { v: number }[];
  return rows[0]?.v ?? 1;
}

export async function saveDocument(input: {
  clientId: string;
  docType: DocType;
  title: string;
  contentMd: string;
  promptTemplateId: string;
  inputSnapshot: Record<string, unknown>;
  createdBy: string;
}): Promise<GeneratedDocument> {
  const sql = getSql();
  const version = await nextVersion(input.clientId, input.docType);
  const rows = (await sql`
    insert into generated_documents
      (client_company_id, doc_type, version, title, content_md, prompt_template_id,
       input_snapshot, status, created_by)
    values
      (${input.clientId}, ${input.docType}, ${version}, ${input.title}, ${input.contentMd},
       ${input.promptTemplateId}, ${JSON.stringify(input.inputSnapshot)}, 'draft', ${input.createdBy})
    returning id, client_company_id, doc_type, version, title, content_md,
              prompt_template_id, input_snapshot, status, created_by, created_at, finalized_at
  `) as GeneratedDocument[];
  return rows[0];
}

export async function finalizeDocument(clientId: string, docId: string): Promise<void> {
  const sql = getSql();
  await sql`
    update generated_documents set status = 'final', finalized_at = now()
    where id = ${docId} and client_company_id = ${clientId}
  `;
}

/**
 * Reúne el contexto del expediente para alimentar la generación: datos del
 * cliente, inventario clasificado y la unión de obligaciones vigentes.
 */
export interface ExpedienteContext {
  client: ClientCompany;
  sistemasText: string;
  obligacionesText: string;
  obligationCodes: string[];
}

export async function gatherContext(client: ClientCompany): Promise<ExpedienteContext> {
  const sql = getSql();
  const systems = (await sql`
    select s.name, s.vendor, s.purpose, s.role, s.current_risk,
           c.obligations as obligations
    from ai_systems s
    left join classifications c on c.id = s.current_classification_id
    where s.client_company_id = ${client.id}
    order by s.created_at asc
  `) as {
    name: string;
    vendor: string | null;
    purpose: string | null;
    role: string;
    current_risk: string | null;
    obligations: Obligation[] | null;
  }[];

  const sistemasText =
    systems.length === 0
      ? "(sin sistemas cargados)"
      : systems
          .map(
            (s) =>
              `- ${s.name}${s.vendor ? ` (${s.vendor})` : ""}: ${s.purpose ?? "sin finalidad"}. Rol: ${s.role}. Riesgo: ${s.current_risk ?? "sin clasificar"}.`,
          )
          .join("\n");

  const obMap = new Map<string, Obligation>();
  for (const s of systems) {
    for (const o of s.obligations ?? []) {
      if (!obMap.has(o.code)) obMap.set(o.code, o);
    }
  }
  const obligaciones = [...obMap.values()];
  const obligacionesText =
    obligaciones.length === 0
      ? "(sin obligaciones detectadas; clasificá los sistemas primero)"
      : obligaciones
          .map((o) => `- ${o.titulo} (${o.articulo}, ${o.estado}): ${o.resumen}`)
          .join("\n");

  return {
    client,
    sistemasText,
    obligacionesText,
    obligationCodes: obligaciones.map((o) => o.code),
  };
}
