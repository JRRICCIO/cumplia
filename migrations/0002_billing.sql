-- ============================================================
-- 0002_billing.sql — entitlements con `product` como dimensión
-- Preparado para el 2º producto (eaa) sin sobre-ingeniería: solo se agrega un
-- valor al check de product y una fila por org cuando exista.
-- ============================================================

create table if not exists entitlements (
  id                     uuid primary key default gen_random_uuid(),
  org_id                 text not null,
  product                text not null check (product in ('ai_act','eaa')),
  plan                   text not null,   -- 'trial'|'empresa_s'|'empresa_m'|'empresa_l'|'asesoria_10'|'asesoria_25'
  status                 text not null check (status in ('trialing','active','past_due','canceled')),
  max_clients            int not null default 1,
  stripe_subscription_id text,
  current_period_end     timestamptz,
  trial_ends_at          timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (org_id, product)
);
create index if not exists idx_entitlements_org on entitlements (org_id);

-- Idempotencia de webhooks de Stripe: un evento se procesa una sola vez.
create table if not exists stripe_events (
  id         text primary key,   -- event.id de Stripe
  type       text not null,
  created_at timestamptz not null default now()
);
