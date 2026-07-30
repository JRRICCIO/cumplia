import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import HeaderNav from "@/components/HeaderNav";
import LanguageToggle from "@/components/LanguageToggle";
import FooterLinks from "@/components/FooterLinks";
import CookieBanner from "@/components/CookieBanner";
import { I18nProvider } from "@/components/I18nProvider";
import { getLocale } from "@/lib/core/i18n-server";
import { BRAND } from "@/lib/core/i18n";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display-f",
  display: "swap",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-f",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono-f",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Cumplai — El expediente del EU AI Act, sin humo",
    template: "%s · Cumplai",
  },
  description:
    "Cumplai arma y mantiene el expediente de cumplimiento del EU AI Act: inventario de sistemas, clasificación de riesgo, formación Art. 4 y documentación, fechado y exportable. Multi-cliente para asesorías.",
  openGraph: {
    title: "Cumplai — El expediente del EU AI Act",
    description:
      "Inventario, clasificación de riesgo, formación Art. 4 y documentación del AI Act. Multi-cliente para asesorías.",
    type: "website",
    locale: "es_ES",
    siteName: "Cumplai",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        <I18nProvider locale={locale}>
          <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-40 border-b border-border bg-bg/70 backdrop-blur-xl">
              <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
                <Link href="/" className="flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-[10px] text-accent-fg"
                    style={{ background: "var(--grad)" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="flex flex-col leading-none">
                    <span className="text-[15px] font-semibold tracking-tight">{BRAND}</span>
                    <span className="eyebrow text-[9px]">EU AI Act compliance</span>
                  </span>
                </Link>
                <div className="flex items-center gap-3">
                  <HeaderNav />
                  <LanguageToggle />
                </div>
              </div>
            </header>
            <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
            <footer className="border-t border-border">
              <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
                <span className="text-xs text-muted">
                  © {new Date().getFullYear()} {BRAND}
                </span>
                <FooterLinks />
              </div>
            </footer>
          </div>
          <CookieBanner />
        </I18nProvider>
      </body>
    </html>
  );
}
