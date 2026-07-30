import { NextResponse } from "next/server";
import { requireClientAccess } from "@/lib/core/session";
import { requireEntitlement } from "@/lib/core/entitlements";
import {
  createSystem,
  listSystems,
  saveClassification,
  type Lifecycle,
  type SystemRole,
} from "@/lib/ai-act/systems";
import { evaluate } from "@/lib/ai-act/ruleset";
import type { Answers } from "@/lib/ai-act/types";
import { logAudit } from "@/lib/core/audit";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireClientAccess(id, request.headers);
  if (!access) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const systems = await listSystems(id);
  return NextResponse.json({ systems });
}

const ROLES: SystemRole[] = ["deployer", "provider", "ambos"];
const LIFECYCLES: Lifecycle[] = ["planificado", "piloto", "en_uso", "retirado"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireClientAccess(id, request.headers);
  if (!access) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const ent = await requireEntitlement(access.ctx.orgId, "ai_act");
  if (!ent) return NextResponse.json({ error: "upgrade_required" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "name_required" }, { status: 400 });

  const system = await createSystem(id, {
    name: name.slice(0, 200),
    vendor: (body.vendor as string)?.trim() || null,
    purpose: (body.purpose as string)?.trim() || null,
    role: ROLES.includes(body.role as SystemRole) ? (body.role as SystemRole) : "deployer",
    lifecycle: LIFECYCLES.includes(body.lifecycle as Lifecycle)
      ? (body.lifecycle as Lifecycle)
      : "en_uso",
    notes: (body.notes as string)?.trim() || null,
  });

  await logAudit({
    orgId: access.ctx.orgId,
    clientCompanyId: id,
    actorUserId: access.ctx.userId,
    actorEmail: access.ctx.email,
    entityType: "ai_system",
    entityId: system.id,
    action: "created",
    summary: `Sistema de IA "${system.name}" añadido al inventario.`,
  });

  // Flujo guiado: si vienen respuestas, clasificamos en el mismo paso.
  if (body.answers && typeof body.answers === "object") {
    const result = evaluate(body.answers as Answers);
    const classification = await saveClassification(
      system.id,
      body.answers as Answers,
      result,
      access.ctx.email,
    );
    await logAudit({
      orgId: access.ctx.orgId,
      clientCompanyId: id,
      actorUserId: access.ctx.userId,
      actorEmail: access.ctx.email,
      entityType: "classification",
      entityId: classification.id,
      action: "classified",
      summary: `"${system.name}" clasificado como ${result.riskLabel}.`,
      payload: { risk: result.riskLevel },
    });
    return NextResponse.json({ system, result }, { status: 201 });
  }

  return NextResponse.json({ system }, { status: 201 });
}
