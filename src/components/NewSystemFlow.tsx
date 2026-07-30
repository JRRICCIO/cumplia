"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CheckerWizard from "@/components/CheckerWizard";
import RiskBadge from "@/components/RiskBadge";
import ObligationsList from "@/components/ObligationsList";
import type { Answers, ClassificationResult } from "@/lib/ai-act/types";

/**
 * Flujo guiado de un solo paso: contar qué hace la IA y, con las mismas
 * preguntas del checker (en lenguaje llano), anotarla y clasificarla de una.
 */
export default function NewSystemFlow({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<"datos" | "preguntas" | "resultado">("datos");
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [vendor, setVendor] = useState("");
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClassificationResult | null>(null);

  async function submit(answers: Answers) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/systems`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, purpose, vendor, answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "upgrade_required"
            ? "Necesitás un plan activo para anotar sistemas."
            : "No se pudo guardar. Probá de nuevo.",
        );
        return;
      }
      setResult(data.result);
      setPhase("resultado");
    } catch {
      setError("Error de red.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href={`/clients/${clientId}`} className="text-sm text-muted hover:text-fg">
          ← {clientName}
        </Link>
        <h1 className="mt-2 font-display text-4xl">Anotá una IA</h1>
      </div>

      {phase === "datos" && (
        <div className="card space-y-4 p-6">
          <p className="text-sm text-muted">
            Pensá en una herramienta con IA que usás (un chatbot, un asistente, un
            sistema que filtra CVs…). Contanos lo básico y en un minuto sabés qué te
            pide la ley.
          </p>
          <div>
            <label className="label">¿Cómo la llamás?</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Chatbot de atención al cliente"
              autoFocus
            />
          </div>
          <div>
            <label className="label">¿Qué hace? (opcional)</label>
            <input
              className="input"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Responde consultas de clientes en la web"
            />
          </div>

          {!more ? (
            <button onClick={() => setMore(true)} className="text-sm text-muted hover:text-fg">
              + Más datos (opcional)
            </button>
          ) : (
            <div>
              <label className="label">¿Quién la provee? (opcional)</label>
              <input
                className="input"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="OpenAI, un proveedor, desarrollo propio…"
              />
            </div>
          )}

          <button
            onClick={() => setPhase("preguntas")}
            disabled={!name.trim()}
            className="btn btn-accent"
          >
            Siguiente →
          </button>
        </div>
      )}

      {phase === "preguntas" && (
        <div className="card p-6">
          <p className="mb-4 text-sm text-muted">
            Unas preguntas rápidas sobre <strong>{name}</strong>. No hay respuestas
            incorrectas; elegí lo que mejor describa tu caso.
          </p>
          <CheckerWizard submitLabel="Anotar y clasificar" onComplete={submit} busy={busy} />
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        </div>
      )}

      {phase === "resultado" && result && (
        <div className="space-y-5">
          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl">Listo, quedó anotada</h2>
              <RiskBadge level={result.riskLevel} />
            </div>
            <p className="mt-2 text-sm text-muted">{result.summary}</p>
          </div>
          <div className="card p-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-faint">
              Qué te pide la ley por esta IA
            </h3>
            <ObligationsList obligations={result.obligations} />
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/clients/${clientId}`} className="btn btn-accent">
              Volver al expediente
            </Link>
            <button
              onClick={() => {
                setName("");
                setPurpose("");
                setVendor("");
                setResult(null);
                setMore(false);
                setPhase("datos");
              }}
              className="btn btn-ghost"
            >
              Anotar otra IA
            </button>
            <Link href={`/clients/${clientId}/systems`} className="btn btn-ghost">
              Ver el inventario
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
