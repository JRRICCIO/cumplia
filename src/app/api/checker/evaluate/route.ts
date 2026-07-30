import { NextResponse } from "next/server";
import { evaluate } from "@/lib/ai-act/ruleset";
import type { Answers } from "@/lib/ai-act/types";

export const runtime = "nodejs";

/** Público: evalúa las respuestas server-side (la lógica no se expone al cliente). */
export async function POST(request: Request) {
  let body: { answers?: Answers };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const answers = body.answers ?? {};
  const result = evaluate(answers);
  return NextResponse.json({ result });
}
