import type { RuleSet } from "./types";

/**
 * RULESET v1 — BORRADOR JURÍDICO. A validar por un profesional antes de publicar.
 *
 * Basado en el Reglamento (UE) 2024/1689 (EU AI Act). Refleja el enfoque
 * post-Digital Omnibus: las obligaciones de alto riesgo del Anexo III se marcan
 * como APLAZADAS (aplicación plena hacia 2027-2028), de modo que la acción de hoy
 * es "preparar el expediente", sin vender pánico. La alfabetización en IA (Art. 4)
 * está vigente desde el 2/2/2025 y se añade siempre.
 *
 * Honestidad de alcance para deployers (responsables del despliegue): buena parte
 * de los deberes de transparencia del Art. 50 recaen en el PROVEEDOR; los deberes
 * propios del deployer se limitan a reconocimiento de emociones/biometría (50.3),
 * deepfakes (50.4) y texto de interés público publicado (50.4). El motor lo
 * refleja combinando el rol con el tipo de uso.
 */
export const RULESET_V1: RuleSet = {
  product: "ai_act",
  version: "v2026-07",
  legalBasis:
    "Reglamento (UE) 2024/1689 (EU AI Act), enfoque post-Digital Omnibus. Borrador orientativo — no es asesoramiento legal.",
  nodes: [
    {
      key: "q_rol",
      kind: "single",
      sortOrder: 1,
      question: "¿Vos hiciste esta IA o solo la usás?",
      help: "Sirve para saber qué obligaciones te tocan a vos y cuáles a quien la desarrolló.",
      legalRef: "Art. 3",
      options: [
        { key: "deployer", label: "Solo la uso en mi empresa (no la desarrollé yo)", flags: ["rol_deployer"] },
        { key: "provider", label: "La desarrollo o la vendo bajo mi marca", flags: ["rol_provider"] },
        { key: "ambos", label: "Las dos cosas", flags: ["rol_provider", "rol_deployer"] },
      ],
    },
    {
      key: "q_practicas_prohibidas",
      kind: "multi",
      sortOrder: 2,
      question: "¿El sistema hace alguna de estas prácticas?",
      help: "Prácticas prohibidas por el Art. 5. Marcá todas las que apliquen; si ninguna, dejá vacío.",
      legalRef: "Art. 5",
      options: [
        { key: "manipulacion", label: "Manipulación subliminal o técnicas engañosas para alterar el comportamiento", flags: ["practica_prohibida"] },
        { key: "vulnerabilidad", label: "Explotación de vulnerabilidades (edad, discapacidad, situación socioeconómica)", flags: ["practica_prohibida"] },
        { key: "social_scoring", label: "Puntuación social de personas por su comportamiento o características", flags: ["practica_prohibida"] },
        { key: "biometria_sensible", label: "Categorización biométrica para inferir raza, opiniones, religión, orientación, etc.", flags: ["practica_prohibida"] },
        { key: "scraping_facial", label: "Creación de bases de reconocimiento facial por scraping masivo de internet/CCTV", flags: ["practica_prohibida"] },
        { key: "ninguna_prohibida", label: "Ninguna de estas", flags: [] },
      ],
    },
    {
      key: "q_ambito_anexo3",
      kind: "multi",
      sortOrder: 3,
      question: "¿Para algo de esto se usa la IA?",
      help: "Estos usos son 'de alto riesgo' para la ley. Sus exigencias plenas están aplazadas (hacia 2027-2028), pero conviene dejar el expediente preparado. Marcá lo que aplique; si nada, la última opción.",
      legalRef: "Anexo III",
      options: [
        { key: "rrhh", label: "Selección de personal, evaluación o promoción de empleados", flags: ["alto_riesgo_anexo3"] },
        { key: "credito", label: "Evaluación de solvencia o scoring crediticio de personas", flags: ["alto_riesgo_anexo3"] },
        { key: "educacion", label: "Acceso a educación o evaluación de estudiantes/exámenes", flags: ["alto_riesgo_anexo3"] },
        { key: "servicios_esenciales", label: "Acceso a servicios esenciales (públicos, seguros de salud/vida)", flags: ["alto_riesgo_anexo3"] },
        { key: "biometria_id", label: "Identificación biométrica de personas", flags: ["alto_riesgo_anexo3"] },
        { key: "otros_anexo", label: "Infraestructuras críticas, aplicación de la ley, migración o justicia", flags: ["alto_riesgo_anexo3"] },
        { key: "ninguno_anexo", label: "Ninguno de estos", flags: [] },
      ],
    },
    {
      key: "q_interactua",
      kind: "single",
      sortOrder: 4,
      question: "¿El sistema interactúa directamente con personas (chatbot, asistente virtual)?",
      legalRef: "Art. 50.1",
      options: [
        { key: "si", label: "Sí", flags: ["interactua"] },
        { key: "no", label: "No", flags: [] },
      ],
    },
    {
      key: "q_genera_contenido",
      kind: "single",
      sortOrder: 5,
      question: "¿Genera o manipula contenido (texto, imagen, audio o vídeo) que podría parecer real?",
      help: "Incluye imágenes o vídeos sintéticos (deepfakes) publicados.",
      legalRef: "Art. 50.2 y 50.4",
      options: [
        { key: "deepfake_publico", label: "Sí, y se publica/difunde (podría confundirse con real)", flags: ["genera_contenido", "deepfake"] },
        { key: "genera_interno", label: "Sí, pero solo uso interno", flags: ["genera_contenido"] },
        { key: "no", label: "No", flags: [] },
      ],
    },
    {
      key: "q_emociones",
      kind: "single",
      sortOrder: 6,
      question: "¿El sistema reconoce emociones o categoriza a personas por datos biométricos?",
      legalRef: "Art. 50.3",
      options: [
        { key: "si", label: "Sí", flags: ["emocion_biometria"] },
        { key: "no", label: "No", flags: [] },
      ],
    },
    {
      key: "q_texto_publico",
      kind: "single",
      sortOrder: 7,
      question: "¿Publicás texto generado por IA para informar al público sobre asuntos de interés público?",
      help: "P. ej. noticias o comunicados generados por IA difundidos al público.",
      legalRef: "Art. 50.4",
      options: [
        { key: "si", label: "Sí", flags: ["texto_interes_publico"] },
        { key: "no", label: "No", flags: [] },
      ],
    },
  ],
  outcomes: [
    // Prohibido domina todo.
    {
      key: "o_prohibido",
      riskLevel: "prohibido",
      condition: { any: ["practica_prohibida"] },
      summary:
        "El uso descrito encaja con una práctica prohibida por el Art. 5 del AI Act. Estas prácticas no pueden desplegarse en la UE. Revisá el caso con asesoramiento antes de continuar.",
      obligations: [
        {
          code: "art5_cese",
          titulo: "Práctica prohibida — no desplegar",
          articulo: "Art. 5",
          estado: "vigente",
          vigencia: "Desde 2/2/2025",
          resumen: "Las prácticas del Art. 5 están prohibidas en la UE.",
          accion: "No desplegar el sistema; revisar el caso con asesoramiento legal.",
        },
      ],
    },
    // Alto riesgo Anexo III — obligaciones aplazadas.
    {
      key: "o_alto_riesgo_aplazado",
      riskLevel: "alto_riesgo_aplazado",
      condition: { any: ["alto_riesgo_anexo3"], none: ["practica_prohibida"] },
      summary:
        "El sistema opera en un ámbito de alto riesgo (Anexo III). La aplicación plena de las obligaciones está aplazada (hacia 2027-2028), pero conviene dejar el expediente preparado: inventario, supervisión humana y documentación.",
      obligations: [
        {
          code: "art26_deployer_alto",
          titulo: "Obligaciones del responsable del despliegue de alto riesgo",
          articulo: "Art. 26",
          estado: "aplazado",
          vigencia: "Aplicación plena aprox. 2027-2028 (Digital Omnibus)",
          resumen:
            "Uso conforme a instrucciones, supervisión humana, monitorización y conservación de registros.",
          accion:
            "Documentar el sistema, asignar supervisión humana y preparar el registro de uso.",
        },
        {
          code: "expediente_alto",
          titulo: "Expediente de alto riesgo",
          articulo: "Anexo III / Cap. III",
          estado: "aplazado",
          vigencia: "Preparar ahora; exigible con la aplicación plena",
          resumen: "Documentación técnica, gestión de riesgos y trazabilidad.",
          accion: "Empezar a reunir la evidencia y la documentación del sistema.",
        },
      ],
    },
    // Transparencia — chatbot (deber sobre todo del proveedor).
    {
      key: "o_transparencia_interactua",
      riskLevel: "transparencia",
      condition: { any: ["interactua"] },
      summary:
        "El sistema interactúa con personas: debe informarse a los usuarios de que están tratando con una IA. Este deber recae principalmente en el proveedor del sistema.",
      obligations: [
        {
          code: "art50_1",
          titulo: "Informar de que se interactúa con una IA",
          articulo: "Art. 50.1",
          estado: "vigente",
          vigencia: "Desde 2/8/2026",
          resumen:
            "Los sistemas que interactúan con personas deben informar de que son una IA (salvo que sea evidente).",
          accion:
            "Verificar que el chatbot/asistente muestra un aviso claro de que es una IA.",
        },
      ],
    },
    // Transparencia — contenido sintético / deepfake.
    {
      key: "o_transparencia_deepfake",
      riskLevel: "transparencia",
      condition: { any: ["deepfake", "genera_contenido"] },
      summary:
        "El contenido generado por IA debe marcarse como tal. Para deepfakes publicados, el responsable del despliegue debe divulgar que el contenido es artificial.",
      obligations: [
        {
          code: "art50_2",
          titulo: "Marcar el contenido generado por IA",
          articulo: "Art. 50.2",
          estado: "vigente",
          vigencia: "Desde 2/8/2026",
          resumen:
            "El contenido sintético (texto, imagen, audio, vídeo) debe marcarse en formato legible por máquina.",
          accion: "Configurar el marcado/etiquetado del contenido generado.",
        },
        {
          code: "art50_4_deepfake",
          titulo: "Divulgar deepfakes",
          articulo: "Art. 50.4",
          estado: "vigente",
          vigencia: "Desde 2/8/2026",
          resumen:
            "Quien publique deepfakes debe divulgar que el contenido ha sido generado o manipulado artificialmente.",
          accion: "Añadir la divulgación visible en el contenido publicado.",
        },
      ],
    },
    // Transparencia — reconocimiento de emociones/biometría (deber del deployer).
    {
      key: "o_transparencia_emociones",
      riskLevel: "transparencia",
      condition: { any: ["emocion_biometria"] },
      summary:
        "El uso de reconocimiento de emociones o categorización biométrica obliga a informar a las personas expuestas. Este deber recae en el responsable del despliegue.",
      obligations: [
        {
          code: "art50_3",
          titulo: "Informar del reconocimiento de emociones/biometría",
          articulo: "Art. 50.3",
          estado: "vigente",
          vigencia: "Desde 2/8/2026",
          resumen:
            "Debe informarse a las personas expuestas a sistemas de reconocimiento de emociones o categorización biométrica.",
          accion: "Preparar el aviso a las personas afectadas.",
        },
      ],
    },
    // Transparencia — texto de interés público (deber del deployer).
    {
      key: "o_transparencia_texto_publico",
      riskLevel: "transparencia",
      condition: { any: ["texto_interes_publico"] },
      summary:
        "El texto generado por IA que se publica para informar al público sobre asuntos de interés público debe divulgarse como generado por IA (salvo revisión editorial humana).",
      obligations: [
        {
          code: "art50_4_texto",
          titulo: "Divulgar texto de interés público generado por IA",
          articulo: "Art. 50.4",
          estado: "vigente",
          vigencia: "Desde 2/8/2026",
          resumen:
            "El texto publicado para informar al público debe divulgarse como generado por IA salvo control editorial humano.",
          accion: "Añadir la divulgación o documentar la revisión editorial humana.",
        },
      ],
    },
    // Art. 4 — alfabetización en IA: SIEMPRE aplica a quien usa IA.
    {
      key: "o_art4_siempre",
      riskLevel: "minimo",
      condition: { always: true },
      summary:
        "Toda organización que use IA debe garantizar un nivel suficiente de alfabetización en IA de su personal. Es la obligación transversal y ya está vigente.",
      obligations: [
        {
          code: "art4",
          titulo: "Alfabetización en materia de IA (AI literacy)",
          articulo: "Art. 4",
          estado: "vigente",
          vigencia: "Desde 2/2/2025",
          resumen:
            "El personal que opera o se ve afectado por sistemas de IA debe tener formación suficiente sobre su uso, riesgos y límites.",
          accion:
            "Registrar la formación en IA del personal (quién, cuándo, qué) y conservar la evidencia.",
        },
      ],
    },
  ],
};
