import { getSql } from "./db";

/** Productos del hub. La 2ª línea (eaa) se activa cuando exista el escáner. */
export type ProductKey = "ai_act" | "eaa";

export type EntitlementStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled";

export interface Entitlement {
  id: string;
  org_id: string;
  product: ProductKey;
  plan: string;
  status: EntitlementStatus;
  max_clients: number;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
}

/** Estado efectivo: un trial vencido cuenta como sin acceso. */
export interface EffectiveEntitlement extends Entitlement {
  active: boolean; // puede usar el producto (crear/editar)
  readOnly: boolean; // past_due → solo lectura/exportar
  trialExpired: boolean;
}

const TRIAL_DAYS = 14;

export async function getEntitlement(
  orgId: string,
  product: ProductKey,
): Promise<EffectiveEntitlement | null> {
  const sql = getSql();
  const rows = (await sql`
    select id, org_id, product, plan, status, max_clients,
           stripe_subscription_id, current_period_end, trial_ends_at
    from entitlements
    where org_id = ${orgId} and product = ${product}
    limit 1
  `) as Entitlement[];

  if (rows.length === 0) return null;
  const e = rows[0];

  const now = Date.now();
  const trialExpired =
    e.status === "trialing" &&
    e.trial_ends_at != null &&
    new Date(e.trial_ends_at).getTime() < now;

  const active =
    (e.status === "trialing" && !trialExpired) || e.status === "active";
  const readOnly = e.status === "past_due";

  return { ...e, active, readOnly, trialExpired };
}

/**
 * Crea el entitlement de trial (14 días, sin tarjeta) al dar de alta la org.
 * Idempotente: si ya existe uno para (org, product), no hace nada.
 */
export async function ensureTrialEntitlement(
  orgId: string,
  product: ProductKey,
  maxClients: number,
): Promise<void> {
  const sql = getSql();
  const trialEnds = new Date(
    Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  await sql`
    insert into entitlements (org_id, product, plan, status, max_clients, trial_ends_at)
    values (${orgId}, ${product}, 'trial', 'trialing', ${maxClients}, ${trialEnds})
    on conflict (org_id, product) do nothing
  `;
}

/**
 * Gate para route handlers. Devuelve el entitlement si el producto está
 * utilizable (activo o trial vigente); null si hay que ir a /billing.
 * `allowReadOnly` deja pasar past_due para operaciones de solo lectura/export.
 */
export async function requireEntitlement(
  orgId: string,
  product: ProductKey,
  opts: { allowReadOnly?: boolean } = {},
): Promise<EffectiveEntitlement | null> {
  const e = await getEntitlement(orgId, product);
  if (!e) return null;
  if (e.active) return e;
  if (opts.allowReadOnly && e.readOnly) return e;
  return null;
}

/** Upsert del entitlement de pago desde un webhook de Stripe (idempotente). */
export async function upsertPaidEntitlement(input: {
  orgId: string;
  product: ProductKey;
  plan: string;
  status: EntitlementStatus;
  maxClients: number;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
}): Promise<void> {
  const sql = getSql();
  await sql`
    insert into entitlements
      (org_id, product, plan, status, max_clients, stripe_subscription_id, current_period_end, updated_at)
    values
      (${input.orgId}, ${input.product}, ${input.plan}, ${input.status},
       ${input.maxClients}, ${input.stripeSubscriptionId}, ${input.currentPeriodEnd}, now())
    on conflict (org_id, product) do update set
      plan = excluded.plan,
      status = excluded.status,
      max_clients = excluded.max_clients,
      stripe_subscription_id = excluded.stripe_subscription_id,
      current_period_end = excluded.current_period_end,
      updated_at = now()
  `;
}

/** Cambia solo el estado del entitlement identificado por subscripción de Stripe. */
export async function setEntitlementStatusBySubscription(
  stripeSubscriptionId: string,
  status: EntitlementStatus,
  currentPeriodEnd: string | null,
): Promise<void> {
  const sql = getSql();
  await sql`
    update entitlements
    set status = ${status},
        current_period_end = coalesce(${currentPeriodEnd}, current_period_end),
        updated_at = now()
    where stripe_subscription_id = ${stripeSubscriptionId}
  `;
}

/** Cuántas empresas cliente (no archivadas) tiene la org. */
export async function countClients(orgId: string): Promise<number> {
  const sql = getSql();
  const rows = (await sql`
    select count(*)::int as n
    from client_companies
    where org_id = ${orgId} and archived_at is null
  `) as { n: number }[];
  return rows[0]?.n ?? 0;
}

/**
 * Verifica que la org puede crear un cliente más según su plan.
 * Devuelve { ok } o { ok:false, reason } para responder 403 amable.
 */
export async function assertClientQuota(
  orgId: string,
  product: ProductKey = "ai_act",
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const e = await getEntitlement(orgId, product);
  if (!e || (!e.active && !e.readOnly)) {
    return { ok: false, reason: "upgrade_required" };
  }
  const used = await countClients(orgId);
  if (used >= e.max_clients) {
    return { ok: false, reason: "client_quota_reached" };
  }
  return { ok: true };
}
