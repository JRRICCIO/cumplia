import { getSql } from "./db";

export type OrgType = "empresa" | "asesoria";

export interface OrgMeta {
  org_id: string;
  org_type: OrgType;
  brand_name: string | null;
  logo_url: string | null;
  stripe_customer_id: string | null;
  created_at: string;
}

export async function getOrgMeta(orgId: string): Promise<OrgMeta | null> {
  const sql = getSql();
  const rows = (await sql`
    select org_id, org_type, brand_name, logo_url, stripe_customer_id, created_at
    from orgs_meta where org_id = ${orgId} limit 1
  `) as OrgMeta[];
  return rows[0] ?? null;
}

/** Crea la fila de metadatos de la org (idempotente). */
export async function ensureOrgMeta(
  orgId: string,
  orgType: OrgType,
  brandName?: string | null,
): Promise<void> {
  const sql = getSql();
  await sql`
    insert into orgs_meta (org_id, org_type, brand_name)
    values (${orgId}, ${orgType}, ${brandName ?? null})
    on conflict (org_id) do nothing
  `;
}

export async function updateOrgBrand(
  orgId: string,
  brandName: string | null,
  logoUrl: string | null,
): Promise<void> {
  const sql = getSql();
  await sql`
    update orgs_meta
    set brand_name = ${brandName}, logo_url = ${logoUrl}
    where org_id = ${orgId}
  `;
}

export async function setStripeCustomerId(
  orgId: string,
  customerId: string,
): Promise<void> {
  const sql = getSql();
  await sql`
    update orgs_meta set stripe_customer_id = ${customerId} where org_id = ${orgId}
  `;
}
