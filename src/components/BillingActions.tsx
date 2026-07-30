"use client";

import { useState } from "react";

export function SubscribeButton({ plan, label }: { plan: string; label: string }) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setBusy(false);
    } catch {
      setBusy(false);
    }
  }
  return (
    <button onClick={go} disabled={busy} className="btn btn-accent btn-sm mt-4 w-full">
      {busy ? "Redirigiendo…" : label}
    </button>
  );
}

export function ManageButton({ label }: { label: string }) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setBusy(false);
    } catch {
      setBusy(false);
    }
  }
  return (
    <button onClick={go} disabled={busy} className="btn btn-ghost btn-sm">
      {busy ? "Redirigiendo…" : label}
    </button>
  );
}
