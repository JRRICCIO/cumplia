"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

type Meta = {
  org_type: "empresa" | "asesoria";
  brand_name: string | null;
  logo_url: string | null;
};

export default function SettingsPage() {
  const { t } = useI18n();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [brandName, setBrandName] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/org")
      .then((r) => r.json())
      .then((d) => {
        setMeta(d.meta);
        setBrandName(d.meta?.brand_name ?? "");
      })
      .catch(() => setMeta(null));
  }, []);

  async function saveBrand(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName }),
      });
      if (!res.ok) throw new Error();
      setMsg("Guardado.");
    } catch {
      setMsg("No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadLogo() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await fetch("/api/org/logo", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "");
      setMeta((m) => (m ? { ...m, logo_url: data.logoUrl } : m));
      setMsg("Logo actualizado.");
    } catch {
      setMsg("No se pudo subir el logo (PNG/JPG/SVG/WEBP, máx 2 MB).");
    } finally {
      setUploading(false);
    }
  }

  if (!meta) return <p className="py-10 text-sm text-muted">{t.common.loading}</p>;

  return (
    <div className="mx-auto max-w-lg space-y-8 py-6">
      <h1 className="font-display text-4xl">{t.settings.title}</h1>

      <div className="card space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">{t.settings.brandTitle}</h2>
          <p className="mt-1 text-sm text-muted">{t.settings.brandDesc}</p>
        </div>

        <form onSubmit={saveBrand} className="space-y-3">
          <div>
            <label className="label">{t.settings.brandName}</label>
            <input
              className="input"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Tu asesoría S.L."
            />
          </div>
          <button type="submit" disabled={saving} className="btn btn-accent btn-sm">
            {saving ? t.common.saving : t.common.save}
          </button>
        </form>

        <div className="border-t border-border pt-4">
          <label className="label">{t.settings.logo}</label>
          {meta.logo_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={meta.logo_url}
              alt="Logo"
              className="mb-3 h-16 w-auto rounded-lg border border-border bg-white p-2"
            />
          )}
          <input ref={fileRef} type="file" accept="image/*" className="text-sm" />
          <button
            onClick={uploadLogo}
            disabled={uploading}
            className="btn btn-ghost btn-sm ml-2"
          >
            {uploading ? t.common.saving : t.settings.uploadLogo}
          </button>
        </div>

        {msg && <p className="text-sm text-muted">{msg}</p>}
      </div>

      <div className="card p-6 text-sm">
        <span className="label">{t.settings.orgType}</span>
        <p className="mt-1 font-medium capitalize">{meta.org_type}</p>
      </div>
    </div>
  );
}
