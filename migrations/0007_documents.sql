-- ============================================================
-- 0007_documents.sql — generación documental con IA (prompts versionados)
-- Los prompt_templates se siembran acá como datos: cambiar un prompt = nueva
-- fila version+1, sin deploy de código sensible al contenido.
-- ============================================================

create table if not exists prompt_templates (
  id            uuid primary key default gen_random_uuid(),
  doc_type      text not null,   -- 'politica_uso_ia' | 'aviso_transparencia' | 'clausulas_proveedor'
  version       int not null,
  model         text,
  system_prompt text not null,
  user_template text not null,   -- con placeholders {{empresa}}, {{sistemas}}, {{obligaciones}}
  output_schema jsonb not null,
  status        text not null default 'active' check (status in ('active','retired')),
  created_at    timestamptz not null default now(),
  unique (doc_type, version)
);

create table if not exists generated_documents (
  id                uuid primary key default gen_random_uuid(),
  client_company_id uuid not null references client_companies(id) on delete cascade,
  doc_type          text not null,
  version           int not null,   -- v1, v2... por (cliente, doc_type)
  title             text,
  content_md        text not null,
  prompt_template_id uuid references prompt_templates(id),
  input_snapshot    jsonb,          -- qué datos del expediente se le pasaron al modelo
  status            text not null default 'draft' check (status in ('draft','final')),
  created_by        text,
  created_at        timestamptz not null default now(),
  finalized_at      timestamptz
);
create index if not exists idx_gendocs_client on generated_documents (client_company_id, doc_type, version desc);

-- Siembra de los 3 prompt_templates del MVP (v1). El output_schema fuerza la
-- forma de la salida del modelo (secciones + disclaimers).
insert into prompt_templates (doc_type, version, system_prompt, user_template, output_schema)
values
(
  'politica_uso_ia', 1,
  'Sos un especialista en cumplimiento del EU AI Act. Redactás una POLÍTICA INTERNA DE USO DE IA para una empresa, en español claro y accionable, adaptada a sus sistemas y obligaciones. No inventes hechos que no estén en los datos; si algo falta, dejá una indicación entre corchetes para completar. La política no es asesoramiento legal.',
  'Empresa: {{empresa}}\nSector: {{sector}}\n\nSistemas de IA en uso:\n{{sistemas}}\n\nObligaciones detectadas:\n{{obligaciones}}\n\nRedactá una política interna de uso de IA acorde. Incluí: propósito y alcance, principios de uso responsable, roles y responsabilidades, uso aceptable y prohibido, supervisión humana, transparencia hacia terceros, formación (Art. 4), y revisión periódica.',
  '{"type":"object","additionalProperties":false,"required":["title","sections","disclaimers"],"properties":{"title":{"type":"string"},"sections":{"type":"array","items":{"type":"object","additionalProperties":false,"required":["heading","body_md"],"properties":{"heading":{"type":"string"},"body_md":{"type":"string"}}}},"disclaimers":{"type":"array","items":{"type":"string"}}}}'
),
(
  'aviso_transparencia', 1,
  'Sos un especialista en cumplimiento del EU AI Act. Redactás los AVISOS DE TRANSPARENCIA del Art. 50 que la empresa necesita según sus sistemas, en español. Redactá solo los avisos que apliquen a las obligaciones dadas. No es asesoramiento legal.',
  'Empresa: {{empresa}}\n\nSistemas de IA:\n{{sistemas}}\n\nObligaciones de transparencia detectadas:\n{{obligaciones}}\n\nRedactá los textos de aviso listos para usar (p. ej. aviso de que se interactúa con una IA, divulgación de contenido generado por IA, aviso de reconocimiento de emociones). Un aviso por obligación aplicable.',
  '{"type":"object","additionalProperties":false,"required":["title","sections","disclaimers"],"properties":{"title":{"type":"string"},"sections":{"type":"array","items":{"type":"object","additionalProperties":false,"required":["heading","body_md"],"properties":{"heading":{"type":"string"},"body_md":{"type":"string"}}}},"disclaimers":{"type":"array","items":{"type":"string"}}}}'
),
(
  'clausulas_proveedor', 1,
  'Sos un especialista en contratación y cumplimiento del EU AI Act. Redactás CLÁUSULAS CONTRACTUALES para incluir en acuerdos con proveedores de sistemas de IA, en español, protegiendo a la empresa (deployer) y repartiendo obligaciones del AI Act. No es asesoramiento legal.',
  'Empresa: {{empresa}}\n\nSistemas de IA de terceros:\n{{sistemas}}\n\nObligaciones relevantes:\n{{obligaciones}}\n\nRedactá un anexo de cláusulas para el contrato con el proveedor: información y documentación técnica, cooperación en cumplimiento, transparencia, notificación de incidentes, y asignación de responsabilidades del AI Act.',
  '{"type":"object","additionalProperties":false,"required":["title","sections","disclaimers"],"properties":{"title":{"type":"string"},"sections":{"type":"array","items":{"type":"object","additionalProperties":false,"required":["heading","body_md"],"properties":{"heading":{"type":"string"},"body_md":{"type":"string"}}}},"disclaimers":{"type":"array","items":{"type":"string"}}}}'
)
on conflict (doc_type, version) do nothing;
