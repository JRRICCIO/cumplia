"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { organization, useSession } from "@/lib/core/auth-client";
import { useI18n } from "@/components/I18nProvider";
import type { OrgType } from "@/lib/core/org";

type Org = { id: string; name: string; slug: string };

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || `org-${Math.random().toString(36).slice(2, 8)}`
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { data: session, isPending } = useSession();
  const [orgs, setOrgs] = useState<Org[] | null>(null);
  const [orgType, setOrgType] = useState<OrgType | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.push("/login");
      return;
    }
    organization
      .list()
      .then((res) => setOrgs((res.data as Org[]) ?? []))
      .catch(() => setOrgs([]));
  }, [isPending, session, router]);

  async function activateAndGo(organizationId: string) {
    await organization.setActive({ organizationId });
    router.push("/dashboard");
    router.refresh();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!orgType) {
      setError("Elegí cómo vas a usar Cumplai.");
      return;
    }
    if (!name.trim()) {
      setError("Poné un nombre.");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await organization.create({
        name: name.trim(),
        slug: slugify(name),
      });
      if (error) throw new Error(error.message || "Error al crear la cuenta.");
      const orgId = (data as Org).id;
      await organization.setActive({ organizationId: orgId });

      // Inicializar metadatos + trial + (si empresa) su expediente propio.
      const res = await fetch("/api/org/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgType, name: name.trim() }),
      });
      if (!res.ok) throw new Error("No se pudo inicializar la cuenta.");

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setBusy(false);
    }
  }

  if (isPending || orgs === null) {
    return <p className="py-10 text-sm text-muted">{t.common.loading}</p>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-10">
      <div className="text-center">
        <h1 className="font-display text-4xl">{t.onboarding.title}</h1>
        <p className="mt-2 text-sm text-muted">{t.onboarding.subtitle}</p>
      </div>

      {orgs.length > 0 && (
        <div className="space-y-2">
          <p className="label">{t.onboarding.choose}</p>
          {orgs.map((o) => (
            <button
              key={o.id}
              onClick={() => activateAndGo(o.id)}
              className="card-flat block w-full px-4 py-3 text-left text-sm font-medium transition hover:bg-sunken"
            >
              {o.name}
            </button>
          ))}
          <p className="label pt-2">{t.onboarding.orNew}</p>
        </div>
      )}

      {/* Elección de tipo */}
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            { key: "empresa", title: t.onboarding.typeEmpresa, desc: t.onboarding.typeEmpresaDesc },
            { key: "asesoria", title: t.onboarding.typeAsesoria, desc: t.onboarding.typeAsesoriaDesc },
          ] as const
        ).map((opt) => (
          <button
            key={opt.key}
            onClick={() => setOrgType(opt.key)}
            className={`card p-5 text-left transition ${
              orgType === opt.key ? "ring-2 ring-accent" : "hover:bg-sunken"
            }`}
          >
            <h3 className="text-base font-semibold">{opt.title}</h3>
            <p className="mt-1 text-xs text-muted">{opt.desc}</p>
          </button>
        ))}
      </div>

      {orgType && (
        <form onSubmit={handleCreate} className="card space-y-3 p-6">
          <p className="label">
            {orgType === "empresa"
              ? t.onboarding.orgNameEmpresa
              : t.onboarding.orgNameAsesoria}
          </p>
          <input
            className="input"
            placeholder={
              orgType === "empresa"
                ? t.onboarding.orgNameEmpresa
                : t.onboarding.orgNameAsesoria
            }
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn btn-accent w-full">
            {busy ? t.common.creating : t.onboarding.createContinue}
          </button>
        </form>
      )}
    </div>
  );
}
