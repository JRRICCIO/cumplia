import { NextResponse } from "next/server";
import { getQuestionnaire } from "@/lib/ai-act/ruleset";

export const runtime = "nodejs";

/** Público: devuelve el cuestionario (sin la lógica de outcomes). */
export async function GET() {
  return NextResponse.json({ questionnaire: getQuestionnaire() });
}
