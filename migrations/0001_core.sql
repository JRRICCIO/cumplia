-- ============================================================
-- 0001_core.sql — núcleo agnóstico de producto
-- Se corre DESPUÉS de crear las tablas de auth (npx @better-auth/cli migrate).
-- Convención: org_id es el id de `organization` de Better Auth (text, sin FK,
-- integridad garantizada en la app). El tenant que paga = la organización.
-- ============================================================

-- Metadatos de la organización (tenant): tipo, marca white-label, Stripe.
create table if not exists orgs_meta (
  org_id             text primary key,
  org_type           text not null check (org_type in ('empresa','asesoria')),
  brand_name         text,
  logo_url           text,
  stripe_customer_id text unique,
  created_at         timestamptz not null default now()
);

-- Empresas cliente. Una asesoría tiene N; una empresa individual tiene 1 con
-- is_self=true (creada en el onboarding). Todo el expediente cuelga de acá.
create table if not exists client_companies (
  id            uuid primary key default gen_random_uuid(),
  org_id        text not null,
  name          text not null,
  nif           text,
  sector        text,
  size          text check (size in ('micro','pequena','mediana','grande')),
  contact_name  text,
  contact_email text,
  is_self       boolean not null default false,
  archived_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists idx_client_companies_org on client_companies (org_id) where archived_at is null;

-- Rastro fechado del expediente. El actor se desnormaliza (email) para que el
-- export no dependa de las tablas de auth.
create table if not exists audit_events (
  id                uuid primary key default gen_random_uuid(),
  org_id            text not null,
  client_company_id uuid references client_companies(id) on delete cascade,
  actor_user_id     text,
  actor_email       text,
  entity_type       text not null,
  entity_id         uuid,
  action            text not null,
  summary           text not null,
  payload           jsonb,
  created_at        timestamptz not null default now()
);
create index if not exists idx_audit_client on audit_events (client_company_id, created_at desc);
create index if not exists idx_audit_org on audit_events (org_id, created_at desc);
