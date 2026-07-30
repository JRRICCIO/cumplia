"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";

export default function NewClientPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: "",
    nif: "",
    sector: "",
    size: "",
    contactName: "",
    contactEmail: "",
  });
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function upd(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError("Poné el nombre de la empresa.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "client_quota_reached") {
          setError(t.clients.quotaReached);
        } else if (data.error === "upgrade_required") {
          router.push("/billing");
          return;
        } else {
          setError("No se pudo crear el cliente.");
        }
        setBusy(false);
        return;
      }
      router.push(`/clients/${data.client.id}`);
      router.refresh();
    } catch {
      setError("Error de red.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-6">
      <Link href="/dashboard" className="text-sm text-muted hover:text-fg">
        ← {t.nav.dashboard}
      </Link>
      <div>
        <h1 className="font-display text-4xl">Nueva empresa</h1>
        <p className="mt-1 text-sm text-muted">
          Con el nombre alcanza para empezar. El resto lo podés completar después.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <div>
          <label className="label">Nombre de la empresa</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => upd("name", e.target.value)}
            placeholder="Acme S.L."
            autoFocus
            required
          />
        </div>

        {!more ? (
          <button
            type="button"
            onClick={() => setMore(true)}
            className="text-sm text-muted hover:text-fg"
          >
            + Más datos (opcional)
          </button>
        ) : (
          <div className="space-y-4 border-t border-border pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">{t.clients.nif}</label>
                <input className="input" value={form.nif} onChange={(e) => upd("nif", e.target.value)} />
              </div>
              <div>
                <label className="label">{t.clients.sector}</label>
                <input className="input" value={form.sector} onChange={(e) => upd("sector", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">{t.clients.size}</label>
              <select className="input" value={form.size} onChange={(e) => upd("size", e.target.value)}>
                <option value="">—</option>
                <option value="micro">{t.clients.sizeMicro}</option>
                <option value="pequena">{t.clients.sizePequena}</option>
                <option value="mediana">{t.clients.sizeMediana}</option>
                <option value="grande">{t.clients.sizeGrande}</option>
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">{t.clients.contactName}</label>
                <input className="input" value={form.contactName} onChange={(e) => upd("contactName", e.target.value)} />
              </div>
              <div>
                <label className="label">{t.clients.contactEmail}</label>
                <input className="input" type="email" value={form.contactEmail} onChange={(e) => upd("contactEmail", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn btn-accent w-full">
          {busy ? t.common.creating : "Crear y empezar el expediente"}
        </button>
      </form>
    </div>
  );
}
