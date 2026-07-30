/**
 * Seed de datos demo para QA y demos de venta. Correr con: npm run seed:demo
 * (requiere DATABASE_URL y las migraciones aplicadas).
 *
 * Toma la organización más reciente (la que acabás de crear al registrarte),
 * la marca como asesoría con entitlement de trial, y le carga 3 clientes en
 * distinto estado de semáforo (verde / ámbar / rojo) con sistemas clasificados
 * y formación. No crea usuarios (eso pasa por Better Auth al registrarte).
 */
import { getSql } from "../src/lib/core/db";
import { evaluate } from "../src/lib/ai-act/ruleset";
import type { Answers } from "../src/lib/ai-act/types";

const sql = getSql();

async function main() {
  const orgs = (await sql`
    select id, name from organization order by "createdAt" desc limit 1
  `) as { id: string; name: string }[];
  if (orgs.length === 0) {
    console.error("No hay ninguna organización. Registrate y creá una asesoría primero.");
    process.exit(1);
  }
  const orgId = orgs[0].id;
  console.log(`Sembrando demo en la org "${orgs[0].name}" (${orgId})`);

  // Marca asesoría + trial holgado para la demo.
  await sql`
    insert into orgs_meta (org_id, org_type, brand_name)
    values (${orgId}, 'asesoria', ${orgs[0].name})
    on conflict (org_id) do update set org_type = 'asesoria'
  `;
  const trialEnds = new Date(Date.now() + 14 * 86400000).toISOString();
  await sql`
    insert into entitlements (org_id, product, plan, status, max_clients, trial_ends_at)
    values (${orgId}, 'ai_act', 'trial', 'trialing', 10, ${trialEnds})
    on conflict (org_id, product) do update set max_clients = 10, status = 'trialing'
  `;

  async function newClient(name: string, sector: string, size: string): Promise<string> {
    const rows = (await sql`
      insert into client_companies (org_id, name, sector, size)
      values (${orgId}, ${name}, ${sector}, ${size})
      returning id
    `) as { id: string }[];
    await sql`
      insert into audit_events (org_id, client_company_id, actor_email, entity_type, entity_id, action, summary)
      values (${orgId}, ${rows[0].id}, 'demo@cumplai.app', 'client', ${rows[0].id}, 'created', ${`Cliente "${name}" agregado (demo).`})
    `;
    return rows[0].id;
  }

  async function addSystem(
    clientId: string,
    name: string,
    vendor: string,
    role: string,
    answers: Answers | null,
  ) {
    const sys = (await sql`
      insert into ai_systems (client_company_id, name, vendor, role)
      values (${clientId}, ${name}, ${vendor}, ${role})
      returning id
    `) as { id: string }[];
    const systemId = sys[0].id;
    if (answers) {
      const r = evaluate(answers);
      const cl = (await sql`
        insert into classifications
          (ai_system_id, rule_set_version, answers, risk_level, obligations, summary, classified_by)
        values (${systemId}, ${r.ruleSetVersion}, ${JSON.stringify(answers)}, ${r.riskLevel},
                ${JSON.stringify(r.obligations)}, ${r.summary}, 'demo@cumplai.app')
        returning id
      `) as { id: string }[];
      await sql`
        update ai_systems set current_risk = ${r.riskLevel}, current_classification_id = ${cl[0].id}
        where id = ${systemId}
      `;
    }
    return systemId;
  }

  const chatbot: Answers = {
    q_rol: "deployer",
    q_practicas_prohibidas: ["ninguna_prohibida"],
    q_ambito_anexo3: ["ninguno_anexo"],
    q_interactua: "si",
    q_genera_contenido: "no",
    q_emociones: "no",
    q_texto_publico: "no",
  };
  const rrhh: Answers = {
    q_rol: "deployer",
    q_practicas_prohibidas: ["ninguna_prohibida"],
    q_ambito_anexo3: ["rrhh"],
    q_interactua: "no",
    q_genera_contenido: "no",
    q_emociones: "no",
    q_texto_publico: "no",
  };

  // Verde: 1 sistema, clasificado, con formación.
  const verde = await newClient("Fintech Verde S.L.", "Fintech", "pequena");
  await addSystem(verde, "Chatbot de soporte", "OpenAI", "deployer", chatbot);
  const trV = (await sql`
    insert into trainings (client_company_id, title, provider, training_date)
    values (${verde}, 'Alfabetización en IA — nivel básico', 'Cumplai', current_date)
    returning id
  `) as { id: string }[];
  await sql`
    insert into training_attendees (training_id, person_name, person_role)
    values (${trV[0].id}, 'Ana Pérez', 'Operaciones'), (${trV[0].id}, 'Luis Gómez', 'Soporte')
  `;

  // Ámbar: 2 sistemas, uno sin clasificar.
  const ambar = await newClient("Retail Ámbar S.A.", "Retail", "mediana");
  await addSystem(ambar, "Cribado de currículums", "interno", "deployer", rrhh);
  await addSystem(ambar, "Recomendador de productos", "interno", "deployer", null);

  // Rojo: sin sistemas.
  await newClient("Consultora Roja S.L.", "Servicios", "micro");

  console.log("✅ Demo sembrada: 3 clientes (verde, ámbar, rojo).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
