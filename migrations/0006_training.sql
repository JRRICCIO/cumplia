-- ============================================================
-- 0006_training.sql — formación Art. 4 (alfabetización en IA) + evidencias
-- No es un LMS: solo el REGISTRO de la formación con evidencias adjuntas.
-- ============================================================

create table if not exists trainings (
  id                uuid primary key default gen_random_uuid(),
  client_company_id uuid not null references client_companies(id) on delete cascade,
  title             text not null,
  description       text,
  provider          text,
  training_date     date,
  duration_minutes  int,
  created_at        timestamptz not null default now()
);
create index if not exists idx_trainings_client on trainings (client_company_id, training_date desc);

create table if not exists training_attendees (
  id          uuid primary key default gen_random_uuid(),
  training_id uuid not null references trainings(id) on delete cascade,
  person_name text not null,
  person_email text,
  person_role text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_attendees_training on training_attendees (training_id);

-- Adjuntos genéricos (evidencias de formación hoy; reutilizable a futuro).
-- El binario vive en Vercel Blob; acá solo la URL y metadatos.
create table if not exists attachments (
  id                uuid primary key default gen_random_uuid(),
  client_company_id uuid not null references client_companies(id) on delete cascade,
  entity_type       text not null,   -- 'training' | 'ai_system' | ...
  entity_id         uuid,
  filename          text not null,
  mime              text,
  size_bytes        int,
  blob_url          text not null,
  created_at        timestamptz not null default now()
);
create index if not exists idx_attachments_entity on attachments (entity_type, entity_id);
