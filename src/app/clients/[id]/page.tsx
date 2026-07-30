import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClientAccess } from "@/lib/core/session";
import { listClientAudit } from "@/lib/core/audit";
import { getServerDict } from "@/lib/core/i18n-server";

export const runtime = "nodejs";

function fmt(s: string): string {
  try {
    return new Date(s).toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return s;
  }
}

export default async function ClientOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireClientAccess(id);
  if (!access) notFound();
  const { client, ctx } = access;
  const t = await getServerDict();
  const events = await listClientAudit(ctx.orgId, id, 12);

  const modules = [
    { href: `/clients/${id}/systems`, label: t.clients.openSystems, desc: "Inventario y clasificación de riesgo." },
    { href: `/clients/${id}/training`, label: t.clients.openTraining, desc: "Alfabetización en IA del personal." },
    { href: `/clients/${id}/documents`, label: t.clients.openDocuments, desc: "Política, avisos y cláusulas." },
    { href: `/clients/${id}/export`, label: t.clients.openExport, desc: "Expediente completo en ZIP/PDF." },
  ];

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard" className="text-sm text-muted hover:text-fg">
          ← {t.nav.dashboard}
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <h1 className="font-display text-4xl">{client.name}</h1>
          {client.is_self && <span className="chip chip-accent">Mi empresa</span>}
        </div>
        <p className="mt-1 text-sm text-muted">
          {[client.sector, client.nif, client.size].filter(Boolean).join(" · ") || "—"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map((m) => (
          <Link key={m.href} href={m.href} className="card p-6 transition hover:bg-sunken">
            <h3 className="text-lg font-semibold">{m.label}</h3>
            <p className="mt-1 text-sm text-muted">{m.desc}</p>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-faint">
          Registro de actividad
        </h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted">Todavía no hay actividad registrada.</p>
        ) : (
          <ol className="card divide-y divide-border">
            {events.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-4 px-5 py-3 text-sm">
                <span>{e.summary}</span>
                <span className="shrink-0 text-xs text-faint">{fmt(e.created_at)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
