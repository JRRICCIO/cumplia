"use client";

import Link from "next/link";
import { useSession } from "@/lib/core/auth-client";
import { useI18n } from "@/components/I18nProvider";

export default function LandingPage() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const l = t.landing;
  const authed = !!session?.user;

  return (
    <div className="space-y-24 py-6">
      {/* Hero */}
      <section className="animate-up grid items-center gap-10 md:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <span className="chip chip-accent">{l.eyebrow}</span>
          <h1 className="font-display text-5xl sm:text-6xl">
            {l.title.split(",")[0]},
            <span className="gradient-text"> {l.title.split(",").slice(1).join(",").trim()}</span>
          </h1>
          <p className="max-w-xl text-lg text-muted">{l.subtitle}</p>
          <div className="flex flex-wrap gap-3">
            {authed ? (
              <Link href="/dashboard" className="btn btn-accent">
                {l.ctaDashboard}
              </Link>
            ) : (
              <Link href="/login" className="btn btn-accent">
                {l.ctaStart}
              </Link>
            )}
            <Link href="/checker" className="btn btn-ghost">
              {l.ctaChecker}
            </Link>
          </div>
          <p className="eyebrow">{l.badge}</p>
        </div>

        <div className="card relative overflow-hidden p-6">
          <div
            className="grad-orb pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-20 blur-2xl"
            aria-hidden
          />
          <div className="space-y-4">
            {l.stats.map((s) => (
              <div key={s.k} className="flex items-baseline justify-between border-b border-border pb-3 last:border-0">
                <span className="font-display text-3xl">{s.v}</span>
                <span className="text-sm text-muted">{s.k}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timing / posicionamiento honesto */}
      <section className="card p-8">
        <h2 className="font-display text-3xl">{l.timingTitle}</h2>
        <p className="mt-3 max-w-3xl text-muted">{l.timingBody}</p>
      </section>

      {/* Cómo funciona */}
      <section className="space-y-8">
        <h2 className="font-display text-4xl">{l.howTitle}</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {l.how.map((h) => (
            <div key={h.t} className="card p-6">
              <h3 className="text-lg font-semibold">{h.t}</h3>
              <p className="mt-2 text-sm text-muted">{h.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="space-y-8">
        <h2 className="font-display text-4xl">{l.featuresTitle}</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {l.features.map((f) => (
            <div key={f.t} className="card-flat p-6">
              <h3 className="text-base font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm text-muted">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Segmentos */}
      <section className="space-y-8">
        <h2 className="font-display text-4xl">{l.segmentsTitle}</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {l.segments.map((s) => (
            <div key={s.t} className="card p-6">
              <h3 className="text-lg font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="card relative overflow-hidden p-10 text-center">
        <div
          className="grad-orb pointer-events-none absolute inset-x-0 -bottom-24 mx-auto h-56 w-[70%] rounded-full opacity-15 blur-3xl"
          aria-hidden
        />
        <h2 className="font-display text-4xl">{l.finalCta}</h2>
        <div className="mt-6 flex justify-center gap-3">
          <Link href={authed ? "/dashboard" : "/login"} className="btn btn-accent">
            {l.finalCtaBtn}
          </Link>
          <Link href="/checker" className="btn btn-ghost">
            {l.ctaChecker}
          </Link>
        </div>
        <p className="mt-4 text-xs text-faint">{l.disclaimer}</p>
      </section>
    </div>
  );
}
