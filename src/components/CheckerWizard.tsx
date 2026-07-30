"use client";

import { useEffect, useState } from "react";
import type { Answers } from "@/lib/ai-act/types";

interface QOption { key: string; label: string; help?: string }
interface QNode {
  key: string;
  question: string;
  help?: string;
  legalRef?: string;
  kind: "single" | "multi";
  options: QOption[];
}
interface Questionnaire {
  version: string;
  legalBasis: string;
  nodes: QNode[];
}

/**
 * Wizard reutilizable (checker público + clasificación del inventario). Recorre
 * las preguntas una a una y devuelve las respuestas vía onComplete. La evaluación
 * la hace el caller (server-side).
 */
export default function CheckerWizard({
  initialAnswers,
  submitLabel = "Ver resultado",
  onComplete,
  busy,
}: {
  initialAnswers?: Answers;
  submitLabel?: string;
  onComplete: (answers: Answers) => void;
  busy?: boolean;
}) {
  const [q, setQ] = useState<Questionnaire | null>(null);
  const [answers, setAnswers] = useState<Answers>(initialAnswers ?? {});
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/checker/ruleset")
      .then((r) => r.json())
      .then((d) => setQ(d.questionnaire))
      .catch(() => setError("No se pudo cargar el cuestionario."));
  }, []);

  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!q) return <p className="text-sm text-muted">Cargando…</p>;

  const node = q.nodes[step];
  const total = q.nodes.length;
  const isLast = step === total - 1;
  const current = answers[node.key];

  function setSingle(optKey: string) {
    setAnswers((a) => ({ ...a, [node.key]: optKey }));
  }
  function toggleMulti(optKey: string) {
    setAnswers((a) => {
      const prev = Array.isArray(a[node.key]) ? (a[node.key] as string[]) : [];
      const next = prev.includes(optKey)
        ? prev.filter((k) => k !== optKey)
        : [...prev, optKey];
      return { ...a, [node.key]: next };
    });
  }

  const answered =
    node.kind === "single"
      ? typeof current === "string" && current.length > 0
      : Array.isArray(current) && current.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
          <div
            className="h-full rounded-full"
            style={{ width: `${((step + 1) / total) * 100}%`, background: "var(--grad)" }}
          />
        </div>
        <span className="text-xs text-faint">
          {step + 1}/{total}
        </span>
      </div>

      <div>
        <h3 className="text-lg font-semibold">{node.question}</h3>
        {node.legalRef && <p className="mt-1 eyebrow">{node.legalRef}</p>}
        {node.help && <p className="mt-2 text-sm text-muted">{node.help}</p>}
      </div>

      <div className="space-y-2">
        {node.options.map((opt) => {
          const selected =
            node.kind === "single"
              ? current === opt.key
              : Array.isArray(current) && current.includes(opt.key);
          return (
            <button
              key={opt.key}
              onClick={() => (node.kind === "single" ? setSingle(opt.key) : toggleMulti(opt.key))}
              className={`block w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                selected
                  ? "border-accent bg-accent-soft"
                  : "border-border-strong hover:bg-sunken"
              }`}
            >
              <span className="font-medium">{opt.label}</span>
              {opt.help && <span className="mt-0.5 block text-xs text-faint">{opt.help}</span>}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="btn btn-ghost btn-sm"
        >
          Atrás
        </button>
        {isLast ? (
          <button
            onClick={() => onComplete(answers)}
            disabled={!answered || busy}
            className="btn btn-accent btn-sm"
          >
            {busy ? "Calculando…" : submitLabel}
          </button>
        ) : (
          <button
            onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
            disabled={!answered}
            className="btn btn-accent btn-sm"
          >
            Siguiente
          </button>
        )}
      </div>
    </div>
  );
}
