"use client";

import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";

export default function FooterLinks() {
  const { t } = useI18n();
  const links = [
    { href: "/legal/notice", label: t.legal.notice },
    { href: "/legal/terms", label: t.legal.terms },
    { href: "/legal/privacy", label: t.legal.privacy },
    { href: "/legal/cookies", label: t.legal.cookies },
    { href: "/legal/accessibility", label: t.legal.accessibility },
  ];
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="text-muted transition hover:text-fg">
          {l.label}
        </Link>
      ))}
    </div>
  );
}
