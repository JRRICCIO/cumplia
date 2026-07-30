"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signUp } from "@/lib/core/auth-client";
import { useI18n } from "@/components/I18nProvider";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useI18n();
  const redirectTo = params.get("redirect") || "/onboarding";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await signUp.email({ name, email, password });
        if (error) throw new Error(error.message || "Error al registrarse.");
      } else {
        const { error } = await signIn.email({ email, password });
        if (error) throw new Error(error.message || "Credenciales inválidas.");
      }
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-12">
      <div className="card p-8">
        <div className="text-center">
          <h1 className="font-display text-3xl">
            {mode === "signup" ? t.auth.signupTitle : t.auth.signinTitle}
          </h1>
          <p className="mt-2 text-sm text-muted">{t.auth.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-3">
          {mode === "signup" && (
            <input
              className="input"
              placeholder={t.auth.name}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            className="input"
            type="email"
            placeholder={t.auth.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder={t.auth.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />

          {error && (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn btn-accent w-full">
            {loading
              ? t.auth.processing
              : mode === "signup"
                ? t.auth.create
                : t.auth.enter}
          </button>
        </form>

        <button
          onClick={() => {
            setError(null);
            setMode((m) => (m === "signup" ? "signin" : "signup"));
          }}
          className="mt-5 w-full text-center text-sm text-muted hover:text-fg"
        >
          {mode === "signup" ? t.auth.toSignin : t.auth.toSignup}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="py-10 text-sm">Cargando…</p>}>
      <LoginForm />
    </Suspense>
  );
}
