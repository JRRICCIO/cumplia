-- ============================================================
-- 0003_ruleset.sql — registro de versiones del ruleset del AI Act
-- El árbol de reglas vive en TypeScript (src/lib/ai-act/seed-v1.ts) como fuente
-- de verdad y motor puro testeable. Esta tabla es un REGISTRO de versiones para
-- auditoría: qué versión estuvo activa y desde cuándo. Las clasificaciones
-- guardan `rule_set_version` (texto) para trazar el expediente histórico.
-- ============================================================

create table if not exists rule_sets (
  version     text primary key,           -- coincide con RULESET.version en el código
  product     text not null default 'ai_act',
  status      text not null check (status in ('active','retired')),
  legal_basis text,
  valid_from  date,
  created_at  timestamptz not null default now()
);

insert into rule_sets (version, product, status, legal_basis, valid_from)
values (
  'v2026-07', 'ai_act', 'active',
  'Reglamento (UE) 2024/1689 (EU AI Act), enfoque post-Digital Omnibus. Borrador orientativo.',
  date '2026-07-01'
)
on conflict (version) do nothing;
