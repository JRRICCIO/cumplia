/**
 * Tipos del motor de clasificación de riesgo del EU AI Act.
 *
 * El ruleset es la FUENTE DE VERDAD en TypeScript (seed-v1.ts), versionado por
 * código. El motor (ruleset.ts) es una función PURA sobre estos tipos, testeable
 * sin base de datos. Las clasificaciones guardan `rule_set_version` para que el
 * expediente histórico siga siendo defendible cuando cambien las reglas
 * (p. ej. al aprobarse el texto final del Digital Omnibus → seed-v2.ts).
 */

export type RiskLevel =
  | "prohibido"
  | "alto_riesgo"
  | "alto_riesgo_aplazado"
  | "transparencia"
  | "minimo";

/** Severidad para elegir el nivel "dominante" cuando varios outcomes coinciden. */
export const RISK_SEVERITY: Record<RiskLevel, number> = {
  prohibido: 5,
  alto_riesgo: 4,
  alto_riesgo_aplazado: 3,
  transparencia: 2,
  minimo: 1,
};

export interface Obligation {
  code: string;
  titulo: string;
  articulo: string; // p. ej. "Art. 50.1", "Art. 4", "Anexo III"
  estado: "vigente" | "aplazado";
  vigencia: string; // fecha o descripción legible
  resumen: string;
  accion: string; // qué tiene que hacer la empresa
}

export interface RuleOption {
  key: string;
  label: string;
  help?: string;
  /** Flags que activa elegir esta opción (se acumulan). */
  flags?: string[];
}

export interface RuleNode {
  key: string;
  question: string;
  help?: string;
  legalRef?: string;
  /** single = radio (una opción); multi = checkboxes (varias). */
  kind: "single" | "multi";
  options: RuleOption[];
  sortOrder: number;
}

/** Condición sobre los flags acumulados. Vacía / {always:true} = siempre. */
export interface OutcomeCondition {
  always?: boolean;
  all?: string[]; // deben estar TODOS
  any?: string[]; // al menos UNO
  none?: string[]; // ninguno presente
}

export interface RuleOutcome {
  key: string;
  riskLevel: RiskLevel;
  condition: OutcomeCondition;
  obligations: Obligation[];
  summary: string;
}

export interface RuleSet {
  product: "ai_act";
  version: string; // p. ej. "v2026-07"
  legalBasis: string;
  nodes: RuleNode[];
  outcomes: RuleOutcome[];
}

/** Respuestas del usuario: node_key → option_key(s). */
export type Answers = Record<string, string | string[]>;

export interface ClassificationResult {
  ruleSetVersion: string;
  riskLevel: RiskLevel;
  riskLabel: string;
  obligations: Obligation[];
  matchedOutcomeKeys: string[];
  summary: string;
}

export const RISK_LABEL: Record<RiskLevel, string> = {
  prohibido: "Práctica prohibida",
  alto_riesgo: "Alto riesgo",
  alto_riesgo_aplazado: "Alto riesgo (obligaciones aplazadas)",
  transparencia: "Obligaciones de transparencia",
  minimo: "Riesgo mínimo",
};
