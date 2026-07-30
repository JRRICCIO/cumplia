import Anthropic from "@anthropic-ai/sdk";
import type { ExpedienteContext, PromptTemplate } from "./documents";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

interface GenSection {
  heading: string;
  body_md: string;
}
interface GenOutput {
  title: string;
  sections: GenSection[];
  disclaimers: string[];
}

export interface GeneratedContent {
  title: string;
  contentMd: string;
  inputSnapshot: Record<string, unknown>;
}

function fillTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

/**
 * Genera un documento con Anthropic usando el prompt_template versionado y el
 * contexto del expediente. Sigue el patrón probado en Legal Solution:
 * output_config.format json_schema + thinking adaptive + manejo de refusal +
 * parse defensivo. Devuelve markdown ensamblado y el snapshot de entrada.
 */
export async function generateDocument(
  template: PromptTemplate,
  ctx: ExpedienteContext,
): Promise<GeneratedContent> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Falta ANTHROPIC_API_KEY. Configurala en .env.local.");
  }

  const vars = {
    empresa: ctx.client.name,
    sector: ctx.client.sector ?? "(no indicado)",
    sistemas: ctx.sistemasText,
    obligaciones: ctx.obligacionesText,
  };
  const userMessage = fillTemplate(template.user_template, vars);
  const inputSnapshot = {
    empresa: vars.empresa,
    sector: vars.sector,
    sistemas: ctx.sistemasText,
    obligaciones: ctx.obligacionesText,
    obligationCodes: ctx.obligationCodes,
    ruleContextAt: null as string | null, // se estampa fuera si se necesita
  };

  const params = {
    model: template.model || MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: template.output_schema },
    },
    system: template.system_prompt,
    messages: [{ role: "user", content: userMessage }],
  };

  const client = new Anthropic();
  const response = (await client.messages.create(
    params as unknown as Anthropic.MessageCreateParamsNonStreaming,
  )) as Anthropic.Message;

  if (response.stop_reason === "refusal") {
    throw new Error("El modelo rechazó la solicitud por motivos de seguridad.");
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("La respuesta del modelo no contiene texto analizable.");
  }

  let parsed: GenOutput;
  try {
    parsed = JSON.parse(textBlock.text) as GenOutput;
  } catch {
    throw new Error("No se pudo parsear la respuesta del modelo como JSON.");
  }

  const sections = Array.isArray(parsed.sections) ? parsed.sections : [];
  const disclaimers = Array.isArray(parsed.disclaimers) ? parsed.disclaimers : [];
  const title = parsed.title || "Documento";

  const body = sections
    .map((s) => `## ${s.heading}\n\n${s.body_md}`)
    .join("\n\n");
  const disclaimerBlock =
    disclaimers.length > 0
      ? `\n\n---\n\n${disclaimers.map((d) => `> ${d}`).join("\n\n")}`
      : "\n\n---\n\n> Documento generado con asistencia de IA. No constituye asesoramiento legal. Verificá antes de usar.";

  const contentMd = `# ${title}\n\n${body}${disclaimerBlock}`;

  return { title, contentMd, inputSnapshot };
}
