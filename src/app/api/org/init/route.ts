import { NextResponse } from "next/server";
import { getActiveContext } from "@/lib/core/session";
import { ensureOrgMeta, type OrgType } from "@/lib/core/org";
import { ensureTrialEntitlement } from "@/lib/core/entitlements";
import { getSql } from "@/lib/core/db";
import { logAudit } from "@/lib/core/audit";

export const runtime = "nodejs";

/**
 * Se llama desde el onboarding DESPUÉS de crear y activar la organización en
 * Better Auth. Inicializa los metadatos de la org, el entitlement de trial y,
 * si es una empresa individual, su client_company propia (is_self).
 * Idempotente.
 */
export async function POST(request: Request) {
  const ctx = await getActiveContext(request.headers);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { orgType?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const orgType = body.orgType as OrgType;
  if (orgType !== "empresa" && orgType !== "asesoria") {
    return NextResponse.json({ error: "invalid_org_type" }, { status: 400 });
  }

  await ensureOrgMeta(ctx.orgId, orgType, body.name ?? null);

  // Trial: empresa 1 cliente (su propio expediente); asesoría 3 durante la prueba.
  const trialMaxClients = orgType === "asesoria" ? 3 : 1;
  await ensureTrialEntitlement(ctx.orgId, "ai_act", trialMaxClients);

  // Empresa individual: crear su expediente propio (una sola vez).
  if (orgType === "empresa") {
    const sql = getSql();
    const existing = (await sql`
      select id from client_companies
      where org_id = ${ctx.orgId} and is_self = true and archived_at is null
      limit 1
    `) as { id: string }[];
    if (existing.length === 0) {
      const name = (body.name?.trim() || "Mi empresa").slice(0, 200);
      const rows = (await sql`
        insert into client_companies (org_id, name, is_self)
        values (${ctx.orgId}, ${name}, true)
        returning id
      `) as { id: string }[];
      await logAudit({
        orgId: ctx.orgId,
        clientCompanyId: rows[0].id,
        actorUserId: ctx.userId,
        actorEmail: ctx.email,
        entityType: "client",
        entityId: rows[0].id,
        action: "created",
        summary: `Expediente creado para "${name}".`,
      });
    }
  }

  return NextResponse.json({ ok: true, orgType });
}
