import JSZip from "jszip";
import { getSql } from "@/lib/core/db";
import { getOrgMeta } from "@/lib/core/org";
import { listClientAudit } from "@/lib/core/audit";
import { listAttachments } from "@/lib/core/attachments";
import { fetchFileBytes } from "@/lib/core/storage";
import { renderExpedientePDF, type ExpedienteSystem } from "@/lib/pdf/expediente";
import { renderDocumentPDF } from "@/lib/pdf/document";
import { getActiveRuleSet } from "./ruleset";
import type { ClientCompany } from "@/lib/core/session";
import type { Obligation, RiskLevel } from "./types";

function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function safe(name: string): string {
  return name.replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 60);
}

/**
 * Ensambla el expediente completo del cliente en un ZIP:
 *  - 00-expediente.pdf (portada + inventario + clasificaciones + formación)
 *  - documentos/*.pdf (cada documento generado)
 *  - evidencias/* (adjuntos de formación descargados de Blob)
 *  - 05-registro-de-actividad.csv (audit_events fechados)
 */
export async function buildExpedienteZip(
  orgId: string,
  client: ClientCompany,
  brandFallback: string,
): Promise<{ filename: string; buffer: Buffer }> {
  const sql = getSql();
  const meta = await getOrgMeta(orgId);
  const brandName = meta?.brand_name || brandFallback;
  const activeVersion = getActiveRuleSet().version;

  // Sistemas + clasificación vigente.
  const rawSystems = (await sql`
    select s.name, s.vendor, s.purpose, s.role, s.current_risk,
           cl.obligations as obligations, cl.rule_set_version as version
    from ai_systems s
    left join classifications cl on cl.id = s.current_classification_id
    where s.client_company_id = ${client.id}
    order by s.created_at asc
  `) as {
    name: string;
    vendor: string | null;
    purpose: string | null;
    role: string;
    current_risk: RiskLevel | null;
    obligations: Obligation[] | null;
    version: string | null;
  }[];

  const systems: ExpedienteSystem[] = rawSystems.map((s) => ({
    name: s.name,
    vendor: s.vendor,
    role: s.role,
    risk: s.current_risk,
    purpose: s.purpose,
    obligations: (s.obligations ?? []).map((o) => ({
      titulo: o.titulo,
      articulo: o.articulo,
      estado: o.estado,
    })),
  }));

  // Semáforo.
  const classifiedActive = rawSystems.filter(
    (s) => s.current_risk && s.version === activeVersion,
  ).length;
  const status: "green" | "amber" | "red" =
    systems.length === 0 ? "red" : classifiedActive >= systems.length ? "green" : "amber";

  // Formaciones.
  const trainings = (await sql`
    select t.title, t.provider, t.training_date,
           (select count(*)::int from training_attendees a where a.training_id = t.id) as attendees
    from trainings t
    where t.client_company_id = ${client.id}
    order by t.training_date desc nulls last
  `) as { title: string; provider: string | null; training_date: string | null; attendees: number }[];

  // Documentos.
  const docs = (await sql`
    select id, doc_type, version, title, content_md, status, created_at
    from generated_documents
    where client_company_id = ${client.id}
    order by doc_type asc, version desc
  `) as {
    id: string;
    doc_type: string;
    version: number;
    title: string | null;
    content_md: string;
    status: string;
    created_at: string;
  }[];

  const zip = new JSZip();

  // 00 - Expediente PDF.
  const expedientePdf = await renderExpedientePDF({
    brandName,
    logoUrl: meta?.logo_url,
    clientName: client.name,
    clientMeta: [client.sector, client.nif, client.size].filter(Boolean).join(" · "),
    status,
    generatedAt: new Date().toISOString(),
    ruleSetVersion: activeVersion,
    systems,
    trainings: trainings.map((t) => ({
      title: t.title,
      provider: t.provider,
      date: t.training_date,
      attendees: t.attendees,
    })),
    finalDocs: docs
      .filter((d) => d.status === "final")
      .map((d) => ({ title: d.title || d.doc_type, version: d.version })),
  });
  zip.file("00-expediente.pdf", expedientePdf);

  // documentos/*.pdf
  const docsFolder = zip.folder("documentos");
  for (const d of docs) {
    const pdf = await renderDocumentPDF({
      brandName,
      logoUrl: meta?.logo_url,
      clientName: client.name,
      title: d.title || d.doc_type,
      contentMd: d.content_md,
      version: d.version,
      status: d.status,
      generatedAt: d.created_at,
    });
    docsFolder?.file(`${safe(d.title || d.doc_type)}_v${d.version}.pdf`, pdf);
  }

  // evidencias/* (adjuntos de formación).
  const trainingIds = (await sql`
    select id from trainings where client_company_id = ${client.id}
  `) as { id: string }[];
  const evFolder = zip.folder("evidencias");
  for (const t of trainingIds) {
    const atts = await listAttachments("training", t.id);
    for (const a of atts) {
      try {
        const bytes = await fetchFileBytes(a.blob_url);
        evFolder?.file(`${safe(a.filename)}`, bytes);
      } catch {
        // Si una evidencia no se puede descargar, se omite (no rompe el export).
      }
    }
  }

  // Registro de actividad CSV.
  const events = await listClientAudit(orgId, client.id, 2000);
  const header = "fecha,actor,entidad,accion,resumen\n";
  const rows = events
    .map((e) =>
      [
        e.created_at,
        e.actor_email ?? "",
        e.entity_type,
        e.action,
        e.summary,
      ]
        .map((c) => csvEscape(String(c)))
        .join(","),
    )
    .join("\n");
  zip.file("05-registro-de-actividad.csv", header + rows);

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  const filename = `expediente_${safe(client.name)}.zip`;
  return { filename, buffer };
}
