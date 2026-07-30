"use client";

import { useI18n } from "@/components/I18nProvider";
import type { Locale } from "@/lib/core/i18n";

const OPTIONS: Locale[] = ["es", "en"];

export default function LanguageToggle() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="flex items-center rounded-full border border-border p-0.5 text-[11px] font-semibold">
      {OPTIONS.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`rounded-full px-2.5 py-1 uppercase tracking-wide transition ${
            l === locale ? "bg-fg text-bg" : "text-muted hover:text-fg"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
