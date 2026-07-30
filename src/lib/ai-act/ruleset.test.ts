/**
 * Tests del motor de clasificación (sin DB). Correr con: npm run test:rules
 * Fixtures deterministas que fijan el comportamiento esperado del ruleset v1.
 */
import { evaluate } from "./ruleset";
import type { Answers, RiskLevel } from "./types";

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean) {
  if (cond) {
    passed++;
    console.log("  ✓ " + name);
  } else {
    failed++;
    console.error("  ✗ " + name);
  }
}

function run(
  name: string,
  answers: Answers,
  expectRisk: RiskLevel,
  expectObligations: string[],
) {
  console.log("\n• " + name);
  const r = evaluate(answers);
  check(`riesgo = ${expectRisk} (fue ${r.riskLevel})`, r.riskLevel === expectRisk);
  for (const code of expectObligations) {
    check(
      `incluye obligación ${code}`,
      r.obligations.some((o) => o.code === code),
    );
  }
}

// 1. Chatbot de atención → transparencia (Art. 50.1) + Art. 4 siempre.
run(
  "chatbot_atencion",
  {
    q_rol: "deployer",
    q_practicas_prohibidas: ["ninguna_prohibida"],
    q_ambito_anexo3: ["ninguno_anexo"],
    q_interactua: "si",
    q_genera_contenido: "no",
    q_emociones: "no",
    q_texto_publico: "no",
  },
  "transparencia",
  ["art50_1", "art4"],
);

// 2. Cribado de CV (RRHH) → alto riesgo aplazado + Art. 4.
run(
  "cribado_cv_rrhh",
  {
    q_rol: "deployer",
    q_practicas_prohibidas: ["ninguna_prohibida"],
    q_ambito_anexo3: ["rrhh"],
    q_interactua: "no",
    q_genera_contenido: "no",
    q_emociones: "no",
    q_texto_publico: "no",
  },
  "alto_riesgo_aplazado",
  ["art26_deployer_alto", "art4"],
);

// 3. Social scoring → prohibido (domina aunque haya otros flags).
run(
  "social_scoring",
  {
    q_rol: "ambos",
    q_practicas_prohibidas: ["social_scoring"],
    q_ambito_anexo3: ["credito"],
    q_interactua: "si",
    q_genera_contenido: "no",
    q_emociones: "no",
    q_texto_publico: "no",
  },
  "prohibido",
  ["art5_cese"],
);

// 4. Uso mínimo (una macro de Excel con IA, sin nada especial) → mínimo + Art. 4.
run(
  "uso_minimo",
  {
    q_rol: "deployer",
    q_practicas_prohibidas: ["ninguna_prohibida"],
    q_ambito_anexo3: ["ninguno_anexo"],
    q_interactua: "no",
    q_genera_contenido: "no",
    q_emociones: "no",
    q_texto_publico: "no",
  },
  "minimo",
  ["art4"],
);

// 5. Generador de imágenes publicadas (deepfake) → transparencia + Art. 50.2/50.4.
run(
  "deepfake_publicado",
  {
    q_rol: "provider",
    q_practicas_prohibidas: ["ninguna_prohibida"],
    q_ambito_anexo3: ["ninguno_anexo"],
    q_interactua: "no",
    q_genera_contenido: "deepfake_publico",
    q_emociones: "no",
    q_texto_publico: "no",
  },
  "transparencia",
  ["art50_2", "art50_4_deepfake", "art4"],
);

console.log(`\n──────────\n${passed} pasaron, ${failed} fallaron\n`);
if (failed > 0) process.exit(1);
