import { NextResponse } from "next/server";
import { getActiveContext } from "@/lib/core/session";
import { assertClientQuota } from "@/lib/core/entitlements";
import { createClient, listClientsWithStatus, type ClientSize } from "@/lib/core/clients";
import { logAudit } from "@/lib/core/audit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const ctx = await getActiveContext(request.headers);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const clients = await listClientsWithStatus(ctx.orgId);
  return NextResponse.json({ clients });
}

const VALID_SIZES: ClientSize[] = ["micro", "pequena", "mediana", "grande"];

export async function POST(request: Request) {
  const ctx = await getActiveContext(request.headers);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const quota = await assertClientQuota(ctx.orgId, "ai_act");
  if (!quota.ok) {
    return NextResponse.json({ error: quota.reason }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "name_required" }, { status: 400 });

  const size = VALID_SIZES.includes(body.size as ClientSize)
    ? (body.size as ClientSize)
    : null;

  const client = await createClient(ctx.orgId, {
    name: name.slice(0, 200),
    nif: (body.nif as string)?.trim() || null,
    sector: (body.sector as string)?.trim() || null,
    size,
    contactName: (body.contactName as string)?.trim() || null,
    contactEmail: (body.contactEmail as string)?.trim() || null,
  });

  await logAudit({
    orgId: ctx.orgId,
    clientCompanyId: client.id,
    actorUserId: ctx.userId,
    actorEmail: ctx.email,
    entityType: "client",
    entityId: client.id,
    action: "created",
    summary: `Cliente "${client.name}" agregado a la cartera.`,
  });

  return NextResponse.json({ client }, { status: 201 });
}
