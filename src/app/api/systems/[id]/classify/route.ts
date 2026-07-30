import { NextResponse } from "next/server";
import { getActiveContext } from "@/lib/core/session";
import { requireEntitlement } from "@/lib/core/entitlements";
import { getSystemForOrg, saveClassification } from "@/lib/ai-act/systems";
import { evaluate } from "@/lib/ai-act/ruleset";
import { logAudit } from "@/lib/core/audit";
import type { Answers } from "@/lib/ai-act/types";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await getActiveContext(request.headers);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const found = await getSystemForOrg(ctx.orgId, id);
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const ent = await requireEntitlement(ctx.orgId, "ai_act");
  if (!ent) return NextResponse.json({ error: "upgrade_required" }, { status: 403 });

  let body: { answers?: Answers };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const answers = body.answers ?? {};
  const result = evaluate(answers);
  const classification = await saveClassification(id, answers, result, ctx.email);

  await logAudit({
    orgId: ctx.orgId,
    clientCompanyId: found.clientId,
    actorUserId: ctx.userId,
    actorEmail: ctx.email,
    entityType: "classification",
    entityId: classification.id,
    action: "classified",
    summary: `"${found.system.name}" clasificado como ${result.riskLabel} (reglas ${result.ruleSetVersion}).`,
    payload: { risk: result.riskLevel },
  });

  return NextResponse.json({ result, classification }, { status: 201 });
}
