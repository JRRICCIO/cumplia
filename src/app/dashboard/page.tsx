import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOrgId } from "@/lib/core/session";
import { getOrgMeta } from "@/lib/core/org";
import { listClientsWithStatus, type SemaphoreStatus } from "@/lib/core/clients";
import { getEntitlement } from "@/lib/core/entitlements";
import { getServerDict } from "@/lib/core/i18n-server";
import { getSql } from "@/lib/core/db";

export const runtime = "nodejs";

const DOT: Record<SemaphoreStatus, string> = {
  green: "dot-ok",
  amber: "dot-warn",
  red: "dot-danger",
};

function fmtDate(s: string | null): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default async function DashboardPage() {
  const ctx = await requireOrgId();
  const t = await getServerDict();
  const meta = await getOrgMeta(ctx.orgId);

  // Sin metadatos → onboarding incompleto.
  if (!meta) redirect("/onboarding");

  // Empresa individual: entrar directo a su expediente.
  if (meta.org_type === "empresa") {
    const sql = getSql();
    const self = (await sql`
      select id from client_companies
      where org_id = ${ctx.orgId} and is_self = true and archived_at is null
      limit 1
    `) as { id: string }[];
    if (self.length > 0) redirect(`/clients/${self[0].id}`);
  }

  const clients = await listClientsWithStatus(ctx.orgId);
  const ent = await getEntitlement(ctx.orgId, "ai_act");
  const statusLabel: Record<SemaphoreStatus, string> = {
    green: t.dashboard.green,
    amber: t.dashboard.amber,
    red: t.dashboard.red,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">{t.dashboard.titleAsesoria}</h1>
          {ent?.status === "trialing" && ent.trial_ends_at && (
            <p className="mt-2 text-sm text-muted">
              <span className="chip chip-accent mr-2">{t.billing.trialBadge}</span>
              {t.billing.trialDaysLeft.replace(
                "{n}",
                String(
                  Math.max(
                    0,
                    Math.ceil(
                      (new Date(ent.trial_ends_at).getTime() - Date.now()) /
                        86400000,
                    ),
                  ),
                ),
              )}
            </p>
          )}
        </div>
        <Link href="/clients/new" className="btn btn-accent">
          {t.dashboard.newClient}
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-muted">{t.dashboard.empty}</p>
          <Link href="/clients/new" className="btn btn-ghost mt-4">
            {t.dashboard.emptyLink}
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-faint">
                <th className="px-5 py-3 font-medium">{t.nav.clients}</th>
                <th className="px-5 py-3 font-medium">{t.dashboard.status}</th>
                <th className="px-5 py-3 font-medium">{t.dashboard.systems}</th>
                <th className="px-5 py-3 font-medium">{t.dashboard.lastActivity}</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-sunken">
                  <td className="px-5 py-3">
                    <Link href={`/clients/${c.id}`} className="font-medium hover:text-accent">
                      {c.name}
                    </Link>
                    {c.sector && (
                      <span className="ml-2 text-xs text-faint">{c.sector}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-2">
                      <span className={`dot ${DOT[c.status]}`} />
                      <span className="text-xs text-muted">{statusLabel[c.status]}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted">{c.systems_count}</td>
                  <td className="px-5 py-3 text-muted">{fmtDate(c.last_activity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
