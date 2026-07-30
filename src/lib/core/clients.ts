import { getSql } from "./db";
import type { ClientCompany } from "./session";

export type ClientSize = "micro" | "pequena" | "mediana" | "grande";
export type SemaphoreStatus = "green" | "amber" | "red";

export interface ClientWithStatus extends ClientCompany {
  systems_count: number;
  status: SemaphoreStatus;
  last_activity: string | null;
}

export interface NewClientInput {
  name: string;
  nif?: string | null;
  sector?: string | null;
  size?: ClientSize | null;
  contactName?: string | null;
  contactEmail?: string | null;
}

/**
 * Lista las empresas cliente de la org con un semáforo de estado.
 *
 * El semáforo se afina en la Semana 2, cuando existan las tablas de inventario,
 * formación y documentos. Por ahora la consulta es resiliente: usa `to_regclass`
 * para contar sistemas solo si la tabla `ai_systems` ya existe, de modo que el
 * dashboard funcione en la Semana 1 sin esas tablas.
 */
export async function listClientsWithStatus(
  orgId: string,
): Promise<ClientWithStatus[]> {
  const sql = getSql();
  const hasInventory =
    (
      (await sql`select to_regclass('public.ai_systems') is not null as ok`) as {
        ok: boolean;
      }[]
    )[0]?.ok ?? false;

  // Versión de reglas vigente (dato en DB; la fuente de verdad del árbol vive en
  // TS, pero rule_sets registra qué versión está activa).
  let activeVersion: string | null = null;
  if (hasInventory) {
    const v = (await sql`
      select version from rule_sets
      where product = 'ai_act' and status = 'active'
      order by valid_from desc nulls last limit 1
    `) as { version: string }[];
    activeVersion = v[0]?.version ?? null;
  }

  const clients = (await sql`
    select id, org_id, name, nif, sector, size, contact_name, contact_email,
           is_self, archived_at, created_at
    from client_companies
    where org_id = ${orgId} and archived_at is null
    order by is_self desc, created_at asc
  `) as ClientCompany[];

  const result: ClientWithStatus[] = [];
  for (const c of clients) {
    let systemsCount = 0;
    let classifiedWithActive = 0;
    if (hasInventory) {
      const rows = (await sql`
        select
          count(*)::int as n,
          count(*) filter (
            where current_risk is not null
              and current_classification_id in (
                select id from classifications
                where ai_system_id = ai_systems.id and rule_set_version = ${activeVersion}
              )
          )::int as classified
        from ai_systems where client_company_id = ${c.id}
      `) as { n: number; classified: number }[];
      systemsCount = rows[0]?.n ?? 0;
      classifiedWithActive = rows[0]?.classified ?? 0;
    }
    const lastRows = (await sql`
      select max(created_at) as last from audit_events where client_company_id = ${c.id}
    `) as { last: string | null }[];

    // Semáforo (Semana 2): sin sistemas → rojo; con sistemas pero no todos
    // clasificados con la versión vigente → ámbar; todos clasificados → verde.
    // La Semana 3 sumará formación Art. 4 + política final como requisitos de verde.
    let status: SemaphoreStatus;
    if (systemsCount === 0) status = "red";
    else if (classifiedWithActive >= systemsCount) status = "green";
    else status = "amber";

    result.push({
      ...c,
      systems_count: systemsCount,
      status,
      last_activity: lastRows[0]?.last ?? c.created_at,
    });
  }
  return result;
}

export async function createClient(
  orgId: string,
  input: NewClientInput,
): Promise<ClientCompany> {
  const sql = getSql();
  const rows = (await sql`
    insert into client_companies
      (org_id, name, nif, sector, size, contact_name, contact_email, is_self)
    values
      (${orgId}, ${input.name}, ${input.nif ?? null}, ${input.sector ?? null},
       ${input.size ?? null}, ${input.contactName ?? null},
       ${input.contactEmail ?? null}, false)
    returning id, org_id, name, nif, sector, size, contact_name, contact_email,
              is_self, archived_at, created_at
  `) as ClientCompany[];
  return rows[0];
}

export async function archiveClient(orgId: string, clientId: string): Promise<void> {
  const sql = getSql();
  await sql`
    update client_companies set archived_at = now()
    where id = ${clientId} and org_id = ${orgId} and is_self = false
  `;
}
