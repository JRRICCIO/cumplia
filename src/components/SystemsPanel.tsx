"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RiskBadge from "@/components/RiskBadge";
import type { AiSystem } from "@/lib/ai-act/systems";

const ROLE_LABEL: Record<string, string> = {
  deployer: "La uso",
  provider: "La desarrollo",
  ambos: "Ambos",
};

export default function SystemsPanel({ clientId }: { clientId: string }) {
  const [systems, setSystems] = useState<AiSystem[] | null>(null);

  useEffect(() => {
    fetch(`/api/clients/${clientId}/systems`)
      .then((r) => r.json())
      .then((d) => setSystems(d.systems ?? []))
      .catch(() => setSystems([]));
  }, [clientId]);

  if (systems === null) return <p className="text-sm text-muted">Cargando…</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-faint">
          Sistemas de IA ({systems.length})
        </h2>
        <Link href={`/clients/${clientId}/systems/new`} className="btn btn-accent btn-sm">
          + Anotar una IA
        </Link>
      </div>

      {systems.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-muted">
            Todavía no anotaste ninguna IA. Empezá por la primera y te decimos qué te
            pide la ley.
          </p>
          <Link href={`/clients/${clientId}/systems/new`} className="btn btn-accent mt-4">
            Anotar mi primera IA
          </Link>
        </div>
      ) : (
        <div className="card divide-y divide-border">
          {systems.map((s) => (
            <Link
              key={s.id}
              href={`/clients/${clientId}/systems/${s.id}`}
              className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-sunken"
            >
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-faint">
                  {[s.vendor, ROLE_LABEL[s.role]].filter(Boolean).join(" · ")}
                </p>
              </div>
              {s.current_risk ? (
                <RiskBadge level={s.current_risk} />
              ) : (
                <span className="chip text-[11px] badge-warn border-transparent">Sin clasificar</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
