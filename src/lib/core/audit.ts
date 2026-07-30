import { getSql } from "./db";

/**
 * El expediente ES el rastro fechado. Cada acción relevante inserta un
 * audit_event; el export los vuelca como registro de actividad. El actor se
 * desnormaliza (email) para que el export no dependa de las tablas de auth.
 */
export type AuditEntity =
  | "client"
  | "ai_system"
  | "classification"
  | "training"
  | "document"
  | "export"
  | "billing";

export interface AuditInput {
  orgId: string;
  clientCompanyId?: string | null;
  actorUserId?: string | null;
  actorEmail?: string | null;
  entityType: AuditEntity;
  entityId?: string | null;
  action: string; // 'created' | 'updated' | 'classified' | 'finalized' | 'exported' ...
  summary: string; // frase legible en español para el PDF/CSV
  payload?: Record<string, unknown> | null;
}

export async function logAudit(input: AuditInput): Promise<void> {
  const sql = getSql();
  await sql`
    insert into audit_events
      (org_id, client_company_id, actor_user_id, actor_email,
       entity_type, entity_id, action, summary, payload)
    values
      (${input.orgId}, ${input.clientCompanyId ?? null},
       ${input.actorUserId ?? null}, ${input.actorEmail ?? null},
       ${input.entityType}, ${input.entityId ?? null},
       ${input.action}, ${input.summary},
       ${input.payload ? JSON.stringify(input.payload) : null})
  `;
}

export interface AuditEvent {
  id: string;
  client_company_id: string | null;
  actor_email: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  summary: string;
  created_at: string;
}

/** Eventos de un cliente, del más nuevo al más viejo (para el expediente). */
export async function listClientAudit(
  orgId: string,
  clientCompanyId: string,
  limit = 500,
): Promise<AuditEvent[]> {
  const sql = getSql();
  return (await sql`
    select id, client_company_id, actor_email, entity_type, entity_id,
           action, summary, created_at
    from audit_events
    where org_id = ${orgId} and client_company_id = ${clientCompanyId}
    order by created_at desc
    limit ${limit}
  `) as AuditEvent[];
}
