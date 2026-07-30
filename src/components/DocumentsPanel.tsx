"use client";

import { useEffect, useState } from "react";
import { DOC_TYPES, type DocType, type GeneratedDocument } from "@/lib/ai-act/documents";

function fmt(s: string): string {
  try {
    return new Date(s).toLocaleString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return s;
  }
}

export default function DocumentsPanel({ clientId }: { clientId: string }) {
  const [docs, setDocs] = useState<GeneratedDocument[] | null>(null);
  const [generating, setGenerating] = useState<DocType | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/clients/${clientId}/documents`);
    const data = await res.json();
    setDocs(data.documents ?? []);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function generate(docType: DocType) {
    setGenerating(docType);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "generation_failed"
            ? "La generación falló. Revisá la API key de Anthropic e intentá de nuevo."
            : data.error === "upgrade_required"
              ? "Necesitás un plan activo."
              : "No se pudo generar.",
        );
        return;
      }
      await load();
      setOpen(data.document.id);
    } finally {
      setGenerating(null);
    }
  }

  async function finalize(docId: string) {
    await fetch(`/api/documents/${docId}`, { method: "PATCH" });
    await load();
  }

  if (docs === null) return <p className="text-sm text-muted">Cargando…</p>;

  return (
    <div className="space-y-6">
      {/* Generadores */}
      <div className="grid gap-3 sm:grid-cols-3">
        {DOC_TYPES.map((dt) => (
          <div key={dt.key} className="card p-5">
            <h3 className="text-base font-semibold">{dt.label}</h3>
            <p className="mt-1 text-xs text-muted">{dt.desc}</p>
            <button
              onClick={() => generate(dt.key)}
              disabled={generating !== null}
              className="btn btn-accent btn-sm mt-3 w-full"
            >
              {generating === dt.key ? "Generando…" : "Generar"}
            </button>
          </div>
        ))}
      </div>

      {generating && (
        <p className="text-sm text-muted">
          Generando con IA (puede tardar hasta un minuto)…
        </p>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}

      {/* Documentos generados */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-faint">
          Documentos generados ({docs.length})
        </h2>
        {docs.length === 0 ? (
          <div className="card p-8 text-center text-sm text-muted">
            Todavía no generaste documentos. Clasificá primero los sistemas para que la
            generación use las obligaciones detectadas.
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((d) => {
              const label = DOC_TYPES.find((t) => t.key === d.doc_type)?.label ?? d.doc_type;
              const isOpen = open === d.id;
              return (
                <div key={d.id} className="card overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <p className="font-medium">
                        {d.title || label}{" "}
                        <span className="ml-1 text-xs text-faint">v{d.version}</span>
                      </p>
                      <p className="text-xs text-faint">
                        {label} · {fmt(d.created_at)} ·{" "}
                        {d.status === "final" ? (
                          <span className="text-ok">Final</span>
                        ) : (
                          "Borrador"
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setOpen(isOpen ? null : d.id)} className="btn btn-ghost btn-sm">
                        {isOpen ? "Ocultar" : "Ver"}
                      </button>
                      <a href={`/api/documents/${d.id}/pdf`} className="btn btn-ghost btn-sm">
                        PDF
                      </a>
                      {d.status !== "final" && (
                        <button onClick={() => finalize(d.id)} className="btn btn-accent btn-sm">
                          Finalizar
                        </button>
                      )}
                    </div>
                  </div>
                  {isOpen && (
                    <pre className="max-h-[28rem] overflow-auto border-t border-border bg-sunken px-5 py-4 text-xs whitespace-pre-wrap font-sans leading-relaxed">
                      {d.content_md}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
