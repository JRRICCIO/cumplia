"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CheckerWizard from "@/components/CheckerWizard";
import RiskBadge from "@/components/RiskBadge";
import ObligationsList from "@/components/ObligationsList";
import type { AiSystem, Classification } from "@/lib/ai-act/systems";
import type { Answers } from "@/lib/ai-act/types";

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

export default function SystemDetail({
  clientId,
  systemId,
}: {
  clientId: string;
  systemId: string;
}) {
  const router = useRouter();
  const [system, setSystem] = useState<AiSystem | null>(null);
  const [history, setHistory] = useState<Classification[]>([]);
  const [classifying, setClassifying] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch(`/api/systems/${systemId}`);
    if (!res.ok) {
      router.push(`/clients/${clientId}/systems`);
      return;
    }
    const data = await res.json();
    setSystem(data.system);
    setHistory(data.classifications ?? []);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemId]);

  async function classify(answers: Answers) {
    setBusy(true);
    try {
      const res = await fetch(`/api/systems/${systemId}/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (res.ok) {
        setClassifying(false);
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("¿Eliminar este sistema del inventario?")) return;
    await fetch(`/api/systems/${systemId}`, { method: "DELETE" });
    router.push(`/clients/${clientId}/systems`);
    router.refresh();
  }

  if (!system) return <p className="text-sm text-muted">Cargando…</p>;

  const last = history[0];
  const lastAnswers = (last?.answers ?? undefined) as Answers | undefined;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/clients/${clientId}/systems`}
          className="text-sm text-muted hover:text-fg"
        >
          ← Inventario
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-4xl">{system.name}</h1>
          {system.current_risk && <RiskBadge level={system.current_risk} />}
        </div>
        <p className="mt-1 text-sm text-muted">
          {[system.vendor, system.purpose].filter(Boolean).join(" · ") || "—"}
        </p>
      </div>

      {classifying ? (
        <div className="card p-6">
          <h2 className="mb-4 font-display text-2xl">Clasificar riesgo</h2>
          <CheckerWizard
            initialAnswers={lastAnswers}
            submitLabel="Clasificar"
            onComplete={classify}
            busy={busy}
          />
        </div>
      ) : (
        <div className="flex gap-3">
          <button onClick={() => setClassifying(true)} className="btn btn-accent btn-sm">
            {last ? "Re-clasificar" : "Clasificar riesgo"}
          </button>
          <button onClick={remove} className="btn btn-ghost btn-sm">
            Eliminar sistema
          </button>
        </div>
      )}

      {last && !classifying && (
        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl">Clasificación vigente</h2>
              <span className="text-xs text-faint">
                {fmt(last.created_at)} · reglas {last.rule_set_version}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted">{last.summary}</p>
          </div>
          <div className="card p-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-faint">
              Obligaciones
            </h3>
            <ObligationsList obligations={last.obligations} />
          </div>
        </div>
      )}

      {history.length > 1 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-faint">
            Historial de clasificaciones
          </h3>
          <div className="card divide-y divide-border">
            {history.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <RiskBadge level={c.risk_level} />
                  <span className="text-xs text-faint">
                    {c.classified_by} · reglas {c.rule_set_version}
                  </span>
                </div>
                <span className="text-xs text-faint">{fmt(c.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
