import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClientAccess } from "@/lib/core/session";
import { listClientAudit } from "@/lib/core/audit";
import { getClientProgress, type StepInfo } from "@/lib/ai-act/progress";

export const runtime = "nodejs";

function fmt(s: string): string {
  try {
    return new Date(s).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
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
  const { client } = access;
  const progress = await getClientProgress(id);
  const events = await listClientAudit(access.ctx.orgId, id, 5);

  const base = `/clients/${id}`;
  const META: Record<
    StepInfo["key"],
    { n: number; title: string; desc: string; href: string; cta: string }
  > = {
    sistemas: {
      n: 1,
      title: "Anotá qué IA usás",
      desc: "Un chatbot, un filtro de CVs… Te decimos qué te pide la ley por cada una.",
      href: progress.systemsTotal === 0 ? `${base}/systems/new` : `${base}/systems`,
      cta: "Anotar una IA",
    },
    formacion: {
      n: 2,
      title: "Formá a tu equipo",
      desc: "La ley pide que tu gente sepa usar la IA. Anotá quién se formó y adjuntá la prueba.",
      href: `${base}/training`,
      cta: "Registrar formación",
    },
    documentos: {
      n: 3,
      title: "Generá tus documentos",
      desc: "Política de uso, avisos y cláusulas, escritos por la IA a partir de tus datos.",
      href: `${base}/documents`,
      cta: "Generar documentos",
    },
    exportar: {
      n: 4,
      title: "Descargá tu expediente",
      desc: "Todo junto en un PDF con tu marca, listo para presentar o guardar.",
      href: `${base}/export`,
      cta: "Descargar expediente",
    },
  };

  const pct = Math.round((progress.doneCount / progress.total) * 100);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm text-muted hover:text-fg">
          ← Cartera
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-4xl">{client.name}</h1>
          {client.is_self && <span className="chip chip-accent">Mi empresa</span>}
        </div>
        <p className="mt-1 text-sm text-muted">
          Seguí los pasos y tu expediente del AI Act queda armado. Uno a la vez.
        </p>
      </div>

      {/* Progreso */}
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">
            {progress.doneCount} de {progress.total} pasos listos
          </span>
          <span className="text-faint">{pct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-sunken">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--grad)" }} />
        </div>
      </div>

      {/* Camino guiado */}
      <div className="space-y-3">
        {progress.steps.map((step) => {
          const m = META[step.key];
          if (step.state === "current") {
            return (
              <div
                key={step.key}
                className="card p-5 ring-2 ring-accent"
                style={{ background: "var(--card)" }}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-fg">
                    {m.n}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-semibold">{m.title}</h3>
                    <p className="mt-0.5 text-sm text-muted">{m.desc}</p>
                    <Link href={m.href} className="btn btn-accent btn-sm mt-3">
                      {m.cta} →
                    </Link>
                  </div>
                </div>
              </div>
            );
          }
          const done = step.state === "done";
          return (
            <Link
              key={step.key}
              href={m.href}
              className="card-flat flex items-start gap-3 p-4 transition hover:bg-sunken"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm ${
                  done ? "badge-ok" : "bg-sunken text-faint"
                }`}
              >
                {done ? "✓" : m.n}
              </span>
              <div className="flex-1">
                <h3 className={`font-semibold ${done ? "" : "text-muted"}`}>{m.title}</h3>
                <p className="mt-0.5 text-sm text-faint">{m.desc}</p>
              </div>
              <span className={`shrink-0 self-center text-xs ${done ? "text-ok" : "text-faint"}`}>
                {step.detail}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Actividad reciente (secundaria) */}
      {events.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted hover:text-fg">
            Actividad reciente
          </summary>
          <ul className="mt-2 space-y-1">
            {events.map((e) => (
              <li key={e.id} className="flex justify-between gap-4 text-xs text-faint">
                <span>{e.summary}</span>
                <span className="shrink-0">{fmt(e.created_at)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
