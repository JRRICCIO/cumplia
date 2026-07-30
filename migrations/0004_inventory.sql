-- ============================================================
-- 0004_inventory.sql — inventario de sistemas de IA + clasificaciones
-- ============================================================

create table if not exists ai_systems (
  id                uuid primary key default gen_random_uuid(),
  client_company_id uuid not null references client_companies(id) on delete cascade,
  name              text not null,
  vendor            text,
  purpose           text,
  role              text check (role in ('deployer','provider','ambos')) default 'deployer',
  lifecycle         text check (lifecycle in ('planificado','piloto','en_uso','retirado')) default 'en_uso',
  current_risk      text,               -- desnormalizado de la última clasificación
  current_classification_id uuid,       -- FK lógica a classifications.id
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_ai_systems_client on ai_systems (client_company_id);

-- Historial de clasificaciones: INMUTABLE (solo insert, nunca update). Cada fila
-- congela las respuestas, el resultado y las obligaciones al momento de clasificar,
-- con la versión de reglas usada → expediente defendible aunque cambien las reglas.
create table if not exists classifications (
  id               uuid primary key default gen_random_uuid(),
  ai_system_id     uuid not null references ai_systems(id) on delete cascade,
  rule_set_version text not null,
  answers          jsonb not null,
  risk_level       text not null,
  obligations      jsonb not null,       -- snapshot congelado
  summary          text,
  classified_by    text,                 -- email del actor
  created_at       timestamptz not null default now()
);
create index if not exists idx_classifications_system on classifications (ai_system_id, created_at desc);
