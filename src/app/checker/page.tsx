"use client";

import { useState } from "react";
import Link from "next/link";
import CheckerWizard from "@/components/CheckerWizard";
import RiskBadge from "@/components/RiskBadge";
import ObligationsList from "@/components/ObligationsList";
import type { Answers, ClassificationResult } from "@/lib/ai-act/types";

export default function CheckerPage() {
  const [answers, setAnswers] = useState<Answers | null>(null);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleComplete(a: Answers) {
    setBusy(true);
    try {
      const res = await fetch("/api/checker/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: a }),
      });
      const data = await res.json();
      setAnswers(a);
      setResult(data.result);
    } finally {
      setBusy(false);
    }
  }

  async function saveLead(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/checker/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, email, companyName: company, consent }),
    });
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <div className="text-center">
        <span className="chip chip-accent">Checker gratuito</span>
        <h1 className="mt-3 font-display text-4xl">¿Qué te exige el AI Act?</h1>
        <p className="mt-2 text-sm text-muted">
          Respondé unas preguntas sobre tu uso de IA y te decimos, sin humo, qué
          obligaciones aplican. No es asesoramiento legal.
        </p>
      </div>

      {!result ? (
        <div className="card p-6">
          <CheckerWizard onComplete={handleComplete} busy={busy} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl">Resultado</h2>
              <RiskBadge level={result.riskLevel} />
            </div>
            <p className="mt-3 text-sm text-muted">{result.summary}</p>
          </div>

          <div className="card p-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-faint">
              Obligaciones que aplican
            </h3>
            <ObligationsList obligations={result.obligations} />
          </div>

          {/* Captura de lead + CTA */}
          <div className="card p-6" style={{ background: "var(--accent-soft)" }}>
            <h3 className="text-lg font-semibold">Guardá el expediente y mantenelo al día</h3>
            <p className="mt-1 text-sm text-muted">
              Creá tu cuenta para armar el inventario, registrar la formación y
              generar la documentación. Empezás gratis, sin tarjeta.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/login" className="btn btn-accent">
                Crear cuenta gratis
              </Link>
              <button
                onClick={() => {
                  setResult(null);
                  setAnswers(null);
                }}
                className="btn btn-ghost"
              >
                Rehacer el checker
              </button>
            </div>

            {!sent ? (
              <form onSubmit={saveLead} className="mt-6 space-y-3 border-t border-border pt-4">
                <p className="text-sm text-muted">
                  ¿Preferís que te enviemos el resultado por email?
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    className="input"
                    placeholder="Empresa"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                  <input
                    className="input"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <label className="flex items-start gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5"
                  />
                  Acepto que me contacten sobre el resultado y el cumplimiento del AI
                  Act. Podés darte de baja cuando quieras.
                </label>
                <button
                  type="submit"
                  disabled={!consent || !email}
                  className="btn btn-ghost btn-sm"
                >
                  Enviarme el resultado
                </button>
              </form>
            ) : (
              <p className="mt-4 text-sm text-ok">¡Listo! Te contactamos pronto.</p>
            )}
          </div>
          <p className="text-center text-xs text-faint">
            Motor de reglas v{result.ruleSetVersion} · Borrador orientativo, no es
            asesoramiento legal.
          </p>
        </div>
      )}
    </div>
  );
}
