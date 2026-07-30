"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Training, Attendee } from "@/lib/ai-act/training";
import type { Attachment } from "@/lib/core/attachments";

export default function TrainingDetail({
  clientId,
  trainingId,
}: {
  clientId: string;
  trainingId: string;
}) {
  const router = useRouter();
  const [training, setTraining] = useState<Training | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [evidence, setEvidence] = useState<Attachment[]>([]);
  const [att, setAtt] = useState({ name: "", role: "", email: "" });
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch(`/api/trainings/${trainingId}`);
    if (!res.ok) {
      router.push(`/clients/${clientId}/training`);
      return;
    }
    const data = await res.json();
    setTraining(data.training);
    setAttendees(data.attendees ?? []);
    setEvidence(data.evidence ?? []);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainingId]);

  async function addAttendee(e: React.FormEvent) {
    e.preventDefault();
    if (!att.name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/trainings/${trainingId}/attendees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(att),
      });
      if (res.ok) {
        setAtt({ name: "", role: "", email: "" });
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function removeAttendee(aid: string) {
    await fetch(`/api/trainings/${trainingId}/attendees/${aid}`, { method: "DELETE" });
    await load();
  }

  async function uploadEvidence() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/trainings/${trainingId}/evidence`, { method: "POST", body: fd });
      if (res.ok) {
        if (fileRef.current) fileRef.current.value = "";
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function removeTraining() {
    if (!confirm("¿Eliminar esta formación del registro?")) return;
    await fetch(`/api/trainings/${trainingId}`, { method: "DELETE" });
    router.push(`/clients/${clientId}/training`);
    router.refresh();
  }

  if (!training) return <p className="text-sm text-muted">Cargando…</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/clients/${clientId}/training`} className="text-sm text-muted hover:text-fg">
          ← Formación
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-4xl">{training.title}</h1>
          <div className="flex gap-2">
            <a
              href={`/api/trainings/${trainingId}/certificate`}
              className="btn btn-accent btn-sm"
            >
              Descargar certificado
            </a>
            <button onClick={removeTraining} className="btn btn-ghost btn-sm">
              Eliminar
            </button>
          </div>
        </div>
        <p className="mt-1 text-sm text-muted">
          {[training.provider, training.description].filter(Boolean).join(" · ") || "—"}
        </p>
      </div>

      {/* Asistentes */}
      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-faint">
          Personal formado ({attendees.length})
        </h2>
        <form onSubmit={addAttendee} className="mb-4 flex flex-wrap items-end gap-2">
          <input className="input flex-1" placeholder="Nombre" value={att.name} onChange={(e) => setAtt((a) => ({ ...a, name: e.target.value }))} />
          <input className="input flex-1" placeholder="Rol" value={att.role} onChange={(e) => setAtt((a) => ({ ...a, role: e.target.value }))} />
          <input className="input flex-1" placeholder="Email" value={att.email} onChange={(e) => setAtt((a) => ({ ...a, email: e.target.value }))} />
          <button type="submit" disabled={busy} className="btn btn-accent btn-sm">Añadir</button>
        </form>
        {attendees.length === 0 ? (
          <p className="text-sm text-muted">Sin asistentes.</p>
        ) : (
          <div className="divide-y divide-border">
            {attendees.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {a.person_name}
                  <span className="ml-2 text-xs text-faint">
                    {[a.person_role, a.person_email].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <button onClick={() => removeAttendee(a.id)} className="text-xs text-red-600 hover:underline">
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evidencias */}
      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-faint">
          Evidencias ({evidence.length})
        </h2>
        <div className="mb-4 flex items-center gap-2">
          <input ref={fileRef} type="file" className="text-sm" />
          <button onClick={uploadEvidence} disabled={busy} className="btn btn-ghost btn-sm">
            {busy ? "Subiendo…" : "Subir evidencia"}
          </button>
        </div>
        {evidence.length === 0 ? (
          <p className="text-sm text-muted">Sin evidencias adjuntas (diploma, lista de firmas, material…).</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {evidence.map((ev) => (
              <li key={ev.id}>
                <a href={ev.blob_url} target="_blank" rel="noopener noreferrer" className="link text-fg">
                  {ev.filename}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
