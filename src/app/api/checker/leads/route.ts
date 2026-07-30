import { NextResponse } from "next/server";
import { getSql } from "@/lib/core/db";
import { evaluate } from "@/lib/ai-act/ruleset";
import type { Answers } from "@/lib/ai-act/types";

export const runtime = "nodejs";

/**
 * Público: guarda un lead del checker. El email solo se persiste si consent=true
 * (RGPD). Recalcula el outcome server-side para no confiar en el cliente.
 */
export async function POST(request: Request) {
  let body: {
    answers?: Answers;
    email?: string;
    companyName?: string;
    consent?: boolean;
    utm?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const answers = body.answers ?? {};
  const result = evaluate(answers);
  const consent = body.consent === true;
  const email = consent ? (body.email ?? "").toString().trim().slice(0, 200) || null : null;
  const companyName = (body.companyName ?? "").toString().trim().slice(0, 200) || null;

  const sql = getSql();
  await sql`
    insert into checker_submissions
      (email, company_name, consent, rule_set_version, answers, outcome, utm)
    values
      (${email}, ${companyName}, ${consent}, ${result.ruleSetVersion},
       ${JSON.stringify(answers)}, ${JSON.stringify(result)},
       ${body.utm ? JSON.stringify(body.utm) : null})
  `;

  return NextResponse.json({ ok: true });
}
