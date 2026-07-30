"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Training } from "@/lib/ai-act/training";

function fmt(d: string | null): string {
  if (!d) return "sin fecha";
  try {
    return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

export default function TrainingPanel({ clientId }: { clientId: string }) {
  const [trainings, setTrainings] = useState<Training[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", provider: "", trainingDate: "", durationMinutes: "", description: "" });
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch(`/api/clients/${clientId}/trainings`);
    const data = await res.json();
    setTrainings(data.trainings ?? []);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/trainings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ title: "", provider: "", trainingDate: "", durationMinutes: "", description: "" });
        setAdding(false);
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  if (trainings === null) return <p className="text-sm text-muted">Cargando…</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-faint">
          Formaciones registradas ({trainings.length})
        </h2>
        <button onClick={() => setAdding((v) => !v)} className="btn btn-accent btn-sm">
          {adding ? "Cancelar" : "+ Registrar formación"}
        </button>
      </div>

      {adding && (
        <form onSubmit={add} className="card space-y-3 p-5">
          <div>
            <label className="label">Título *</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Formación en uso responsable de IA"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Proveedor</label>
              <input className="input" value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))} />
            </div>
            <div>
              <label className="label">Fecha</label>
              <input type="date" className="input" value={form.trainingDate} onChange={(e) => setForm((f) => ({ ...f, trainingDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">Duración (min)</label>
              <input type="number" className="input" value={form.durationMinutes} onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Contenido</label>
            <input className="input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Temario o resumen" />
          </div>
          <button type="submit" disabled={busy} className="btn btn-accent btn-sm">
            {busy ? "Guardando…" : "Registrar"}
          </button>
        </form>
      )}

      {trainings.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted">
          Sin formaciones registradas. La alfabetización en IA (Art. 4) es exigible desde febrero de 2025.
        </div>
      ) : (
        <div className="card divide-y divide-border">
          {trainings.map((tr) => (
            <Link
              key={tr.id}
              href={`/clients/${clientId}/training/${tr.id}`}
              className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-sunken"
            >
              <div>
                <p className="font-medium">{tr.title}</p>
                <p className="text-xs text-faint">
                  {[tr.provider, fmt(tr.training_date)].filter(Boolean).join(" · ")}
                </p>
              </div>
              <span className="text-xs text-muted">Ver →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
