"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RiskBadge from "@/components/RiskBadge";
import type { AiSystem } from "@/lib/ai-act/systems";

const ROLE_LABEL: Record<string, string> = {
  deployer: "Responsable del despliegue",
  provider: "Proveedor",
  ambos: "Ambos",
};

export default function SystemsPanel({ clientId }: { clientId: string }) {
  const [systems, setSystems] = useState<AiSystem[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", vendor: "", purpose: "", role: "deployer" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/clients/${clientId}/systems`);
    const data = await res.json();
    setSystems(data.systems ?? []);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function addSystem(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/systems`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error === "upgrade_required" ? "Necesitás un plan activo." : "No se pudo crear.");
        return;
      }
      setForm({ name: "", vendor: "", purpose: "", role: "deployer" });
      setAdding(false);
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (systems === null) return <p className="text-sm text-muted">Cargando…</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-faint">
          Sistemas de IA ({systems.length})
        </h2>
        <button onClick={() => setAdding((v) => !v)} className="btn btn-accent btn-sm">
          {adding ? "Cancelar" : "+ Añadir sistema"}
        </button>
      </div>

      {adding && (
        <form onSubmit={addSystem} className="card space-y-3 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Nombre *</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Chatbot de atención"
              />
            </div>
            <div>
              <label className="label">Proveedor</label>
              <input
                className="input"
                value={form.vendor}
                onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                placeholder="OpenAI, interno…"
              />
            </div>
          </div>
          <div>
            <label className="label">Finalidad</label>
            <input
              className="input"
              value={form.purpose}
              onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
              placeholder="Responder consultas de clientes"
            />
          </div>
          <div>
            <label className="label">Rol</label>
            <select
              className="input"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              <option value="deployer">Responsable del despliegue (lo uso)</option>
              <option value="provider">Proveedor (lo desarrollo)</option>
              <option value="ambos">Ambos</option>
            </select>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={busy} className="btn btn-accent btn-sm">
            {busy ? "Creando…" : "Crear sistema"}
          </button>
        </form>
      )}

      {systems.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted">
          Todavía no hay sistemas. Añadí el primero y clasificá su riesgo.
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
