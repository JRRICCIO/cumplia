import { getSql } from "@/lib/core/db";
import type { ClassificationResult, Obligation, RiskLevel } from "./types";

export type SystemRole = "deployer" | "provider" | "ambos";
export type Lifecycle = "planificado" | "piloto" | "en_uso" | "retirado";

export interface AiSystem {
  id: string;
  client_company_id: string;
  name: string;
  vendor: string | null;
  purpose: string | null;
  role: SystemRole;
  lifecycle: Lifecycle;
  current_risk: RiskLevel | null;
  current_classification_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Classification {
  id: string;
  ai_system_id: string;
  rule_set_version: string;
  answers: Record<string, string | string[]>;
  risk_level: RiskLevel;
  obligations: Obligation[];
  summary: string | null;
  classified_by: string | null;
  created_at: string;
}

export interface NewSystemInput {
  name: string;
  vendor?: string | null;
  purpose?: string | null;
  role?: SystemRole;
  lifecycle?: Lifecycle;
  notes?: string | null;
}

export async function listSystems(clientId: string): Promise<AiSystem[]> {
  const sql = getSql();
  return (await sql`
    select id, client_company_id, name, vendor, purpose, role, lifecycle,
           current_risk, current_classification_id, notes, created_at, updated_at
    from ai_systems
    where client_company_id = ${clientId}
    order by created_at asc
  `) as AiSystem[];
}

export async function getSystem(
  clientId: string,
  systemId: string,
): Promise<AiSystem | null> {
  const sql = getSql();
  const rows = (await sql`
    select id, client_company_id, name, vendor, purpose, role, lifecycle,
           current_risk, current_classification_id, notes, created_at, updated_at
    from ai_systems
    where id = ${systemId} and client_company_id = ${clientId}
    limit 1
  `) as AiSystem[];
  return rows[0] ?? null;
}

export async function createSystem(
  clientId: string,
  input: NewSystemInput,
): Promise<AiSystem> {
  const sql = getSql();
  const rows = (await sql`
    insert into ai_systems (client_company_id, name, vendor, purpose, role, lifecycle, notes)
    values (${clientId}, ${input.name}, ${input.vendor ?? null}, ${input.purpose ?? null},
            ${input.role ?? "deployer"}, ${input.lifecycle ?? "en_uso"}, ${input.notes ?? null})
    returning id, client_company_id, name, vendor, purpose, role, lifecycle,
              current_risk, current_classification_id, notes, created_at, updated_at
  `) as AiSystem[];
  return rows[0];
}

export async function deleteSystem(clientId: string, systemId: string): Promise<void> {
  const sql = getSql();
  await sql`delete from ai_systems where id = ${systemId} and client_company_id = ${clientId}`;
}

/** Inserta una clasificación (inmutable) y actualiza el desnormalizado del sistema. */
export async function saveClassification(
  systemId: string,
  answers: Record<string, string | string[]>,
  result: ClassificationResult,
  classifiedBy: string,
): Promise<Classification> {
  const sql = getSql();
  const rows = (await sql`
    insert into classifications
      (ai_system_id, rule_set_version, answers, risk_level, obligations, summary, classified_by)
    values
      (${systemId}, ${result.ruleSetVersion}, ${JSON.stringify(answers)},
       ${result.riskLevel}, ${JSON.stringify(result.obligations)},
       ${result.summary}, ${classifiedBy})
    returning id, ai_system_id, rule_set_version, answers, risk_level, obligations,
              summary, classified_by, created_at
  `) as Classification[];
  const c = rows[0];
  await sql`
    update ai_systems
    set current_risk = ${result.riskLevel}, current_classification_id = ${c.id}, updated_at = now()
    where id = ${systemId}
  `;
  return c;
}

/**
 * Resuelve un sistema verificando que pertenece a un cliente de la org (no
 * archivado). Es el aislamiento multi-tenant para rutas /api/systems/[id].
 */
export async function getSystemForOrg(
  orgId: string,
  systemId: string,
): Promise<{ system: AiSystem; clientId: string; clientName: string } | null> {
  const sql = getSql();
  const rows = (await sql`
    select s.id, s.client_company_id, s.name, s.vendor, s.purpose, s.role, s.lifecycle,
           s.current_risk, s.current_classification_id, s.notes, s.created_at, s.updated_at,
           c.name as client_name
    from ai_systems s
    join client_companies c on c.id = s.client_company_id
    where s.id = ${systemId} and c.org_id = ${orgId} and c.archived_at is null
    limit 1
  `) as (AiSystem & { client_name: string })[];
  if (rows.length === 0) return null;
  const { client_name, ...system } = rows[0];
  return { system: system as AiSystem, clientId: system.client_company_id, clientName: client_name };
}

export async function listClassifications(systemId: string): Promise<Classification[]> {
  const sql = getSql();
  return (await sql`
    select id, ai_system_id, rule_set_version, answers, risk_level, obligations,
           summary, classified_by, created_at
    from classifications
    where ai_system_id = ${systemId}
    order by created_at desc
  `) as Classification[];
}
