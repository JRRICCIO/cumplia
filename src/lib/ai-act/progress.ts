import { getSql } from "@/lib/core/db";
import { getActiveRuleSet } from "./ruleset";

export type StepState = "done" | "current" | "pending";

export interface StepInfo {
  key: "sistemas" | "formacion" | "documentos" | "exportar";
  state: StepState;
  detail: string; // texto corto de estado ("1 anotada", "Pendiente"...)
}

export interface ExpedienteProgress {
  steps: StepInfo[];
  doneCount: number;
  total: number;
  systemsTotal: number;
  systemsUnclassified: number;
}

/**
 * Calcula el progreso del expediente de un cliente como 4 pasos guiados.
 * El "paso actual" es el primero que no está hecho; los siguientes quedan
 * pendientes. Sirve para la pantalla-guía del expediente.
 */
export async function getClientProgress(clientId: string): Promise<ExpedienteProgress> {
  const sql = getSql();
  const activeVersion = getActiveRuleSet().version;

  const sys = (await sql`
    select
      count(*)::int as total,
      count(*) filter (where current_risk is null)::int as sin_clasificar,
      count(*) filter (
        where current_risk is not null and current_classification_id in (
          select id from classifications
          where ai_system_id = ai_systems.id and rule_set_version = ${activeVersion}
        )
      )::int as clasificados_vigentes
    from ai_systems where client_company_id = ${clientId}
  `) as { total: number; sin_clasificar: number; clasificados_vigentes: number }[];
  const systemsTotal = sys[0]?.total ?? 0;
  const systemsUnclassified = sys[0]?.sin_clasificar ?? 0;
  const systemsAllClassified =
    systemsTotal > 0 && (sys[0]?.clasificados_vigentes ?? 0) >= systemsTotal;

  const tr = (await sql`
    select count(*)::int as n from trainings where client_company_id = ${clientId}
  `) as { n: number }[];
  const trainingsCount = tr[0]?.n ?? 0;

  const doc = (await sql`
    select count(*)::int as n from generated_documents where client_company_id = ${clientId}
  `) as { n: number }[];
  const docsCount = doc[0]?.n ?? 0;

  const exp = (await sql`
    select count(*)::int as n from audit_events
    where client_company_id = ${clientId} and entity_type = 'export'
  `) as { n: number }[];
  const exported = (exp[0]?.n ?? 0) > 0;

  // Estado "hecho" de cada paso.
  const done = {
    sistemas: systemsAllClassified,
    formacion: trainingsCount > 0,
    documentos: docsCount > 0,
    exportar: exported,
  };

  const order: StepInfo["key"][] = ["sistemas", "formacion", "documentos", "exportar"];
  // El paso actual = el primero no hecho.
  const currentKey = order.find((k) => !done[k]);

  const detailFor = (k: StepInfo["key"]): string => {
    switch (k) {
      case "sistemas":
        if (systemsTotal === 0) return "Pendiente";
        if (systemsUnclassified > 0) return `${systemsUnclassified} sin clasificar`;
        return systemsTotal === 1 ? "1 anotada" : `${systemsTotal} anotadas`;
      case "formacion":
        return trainingsCount > 0
          ? trainingsCount === 1
            ? "1 formación"
            : `${trainingsCount} formaciones`
          : "Pendiente";
      case "documentos":
        return docsCount > 0
          ? docsCount === 1
            ? "1 documento"
            : `${docsCount} documentos`
          : "Pendiente";
      case "exportar":
        return exported ? "Descargado" : "Al terminar";
    }
  };

  const steps: StepInfo[] = order.map((k) => ({
    key: k,
    state: done[k] ? "done" : k === currentKey ? "current" : "pending",
    detail: detailFor(k),
  }));

  return {
    steps,
    doneCount: order.filter((k) => done[k]).length,
    total: order.length,
    systemsTotal,
    systemsUnclassified,
  };
}
