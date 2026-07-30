import { headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { getSql } from "./db";

export interface ActiveContext {
  userId: string;
  email: string;
  orgId: string;
}

export interface ClientCompany {
  id: string;
  org_id: string;
  name: string;
  nif: string | null;
  sector: string | null;
  size: string | null;
  contact_name: string | null;
  contact_email: string | null;
  is_self: boolean;
  archived_at: string | null;
  created_at: string;
}

type SessionShape = {
  user: { id: string; email: string; name?: string | null };
  session: { activeOrganizationId?: string | null };
} | null;

/** Sesión actual desde headers (server). `hdrs` opcional para route handlers. */
export async function getSession(hdrs?: Headers): Promise<SessionShape> {
  const session = await auth.api.getSession({
    headers: hdrs ?? (await nextHeaders()),
  });
  return session as unknown as SessionShape;
}

/**
 * Para páginas (Server Components): exige sesión + organización activa.
 * Redirige a /login o /onboarding si falta alguna.
 */
export async function requireOrgId(): Promise<ActiveContext> {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const orgId = session.session.activeOrganizationId;
  if (!orgId) redirect("/onboarding");
  return { userId: session.user.id, email: session.user.email, orgId };
}

/**
 * Para route handlers: devuelve el contexto o null (el caller responde 401/403).
 */
export async function getActiveContext(hdrs: Headers): Promise<ActiveContext | null> {
  const session = await getSession(hdrs);
  if (!session?.user) return null;
  const orgId = session.session.activeOrganizationId;
  if (!orgId) return null;
  return { userId: session.user.id, email: session.user.email, orgId };
}

/**
 * Verifica que una empresa cliente pertenece a la org activa y no está
 * archivada. Núcleo del aislamiento multi-tenant: TODA ruta de expediente
 * (sistemas, formación, documentos, export) pasa por acá antes de tocar las
 * tablas hijas. Devuelve el contexto + el cliente, o null (→ 404/403).
 */
export async function requireClientAccess(
  clientId: string,
  hdrs?: Headers,
): Promise<{ ctx: ActiveContext; client: ClientCompany } | null> {
  const ctx = hdrs
    ? await getActiveContext(hdrs)
    : await getActiveContextFromPage();
  if (!ctx) return null;

  const sql = getSql();
  const rows = (await sql`
    select id, org_id, name, nif, sector, size, contact_name, contact_email,
           is_self, archived_at, created_at
    from client_companies
    where id = ${clientId} and org_id = ${ctx.orgId} and archived_at is null
    limit 1
  `) as ClientCompany[];

  if (rows.length === 0) return null;
  return { ctx, client: rows[0] };
}

/** Variante de getActiveContext para Server Components (lee headers de next). */
async function getActiveContextFromPage(): Promise<ActiveContext | null> {
  const session = await getSession();
  if (!session?.user) return null;
  const orgId = session.session.activeOrganizationId;
  if (!orgId) return null;
  return { userId: session.user.id, email: session.user.email, orgId };
}
