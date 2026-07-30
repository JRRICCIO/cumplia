-- ============================================================
-- 0005_checker.sql — leads del checker público (lead magnet)
-- El email se guarda SOLO con consentimiento explícito (RGPD, art. 6.1.a).
-- ============================================================

create table if not exists checker_submissions (
  id               uuid primary key default gen_random_uuid(),
  email            text,
  company_name     text,
  consent          boolean not null default false,
  rule_set_version text,
  answers          jsonb,
  outcome          jsonb,
  utm              jsonb,
  created_at       timestamptz not null default now()
);
create index if not exists idx_checker_created on checker_submissions (created_at desc);
