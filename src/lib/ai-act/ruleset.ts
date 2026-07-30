import { RULESET_V1 } from "./seed-v1";
import {
  RISK_SEVERITY,
  RISK_LABEL,
  type Answers,
  type ClassificationResult,
  type Obligation,
  type OutcomeCondition,
  type RuleSet,
  type RiskLevel,
} from "./types";

/** Ruleset activo. Cuando el Omnibus finalice, se publica seed-v2 y se cambia acá. */
export function getActiveRuleSet(): RuleSet {
  return RULESET_V1;
}

/** Cuestionario para la UI (sin la lógica de outcomes, que vive en el server). */
export function getQuestionnaire(rs: RuleSet = getActiveRuleSet()) {
  return {
    version: rs.version,
    legalBasis: rs.legalBasis,
    nodes: [...rs.nodes]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((n) => ({
        key: n.key,
        question: n.question,
        help: n.help,
        legalRef: n.legalRef,
        kind: n.kind,
        options: n.options.map((o) => ({ key: o.key, label: o.label, help: o.help })),
      })),
  };
}

/** Acumula los flags activados por las respuestas. */
function collectFlags(rs: RuleSet, answers: Answers): Set<string> {
  const flags = new Set<string>();
  for (const node of rs.nodes) {
    const raw = answers[node.key];
    if (raw == null) continue;
    const chosen = Array.isArray(raw) ? raw : [raw];
    for (const optKey of chosen) {
      const opt = node.options.find((o) => o.key === optKey);
      if (opt?.flags) opt.flags.forEach((f) => flags.add(f));
    }
  }
  return flags;
}

function conditionMatches(cond: OutcomeCondition, flags: Set<string>): boolean {
  if (cond.always) return true;
  if (cond.all && !cond.all.every((f) => flags.has(f))) return false;
  if (cond.any && !cond.any.some((f) => flags.has(f))) return false;
  if (cond.none && cond.none.some((f) => flags.has(f))) return false;
  // Un objeto sin ninguna clave no matchea (evita outcomes vacíos accidentales).
  return Boolean(cond.always || cond.all || cond.any || cond.none);
}

/**
 * Evalúa las respuestas contra el ruleset. Función PURA (sin DB, sin IO).
 * - riskLevel = el nivel más severo entre los outcomes que matchean.
 * - obligations = unión deduplicada de las obligaciones de los outcomes matcheados.
 */
export function evaluate(
  answers: Answers,
  rs: RuleSet = getActiveRuleSet(),
): ClassificationResult {
  const flags = collectFlags(rs, answers);
  const matched = rs.outcomes.filter((o) => conditionMatches(o.condition, flags));

  // Nivel dominante.
  let riskLevel: RiskLevel = "minimo";
  for (const o of matched) {
    if (RISK_SEVERITY[o.riskLevel] > RISK_SEVERITY[riskLevel]) {
      riskLevel = o.riskLevel;
    }
  }

  // Obligaciones únicas por code.
  const byCode = new Map<string, Obligation>();
  for (const o of matched) {
    for (const ob of o.obligations) {
      if (!byCode.has(ob.code)) byCode.set(ob.code, ob);
    }
  }

  // Resumen: el del outcome dominante (o el de prohibido si aplica).
  const dominant =
    matched.find((o) => o.riskLevel === riskLevel) ?? matched[matched.length - 1];

  return {
    ruleSetVersion: rs.version,
    riskLevel,
    riskLabel: RISK_LABEL[riskLevel],
    obligations: [...byCode.values()],
    matchedOutcomeKeys: matched.map((o) => o.key),
    summary: dominant?.summary ?? "",
  };
}
