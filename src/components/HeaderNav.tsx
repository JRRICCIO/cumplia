"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/core/auth-client";
import { useI18n } from "@/components/I18nProvider";

export default function HeaderNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const { t } = useI18n();

  if (isPending || !session?.user) return null;

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  const links = [
    { href: "/dashboard", label: t.nav.dashboard },
    { href: "/members", label: t.nav.team },
    { href: "/settings", label: t.nav.settings },
    { href: "/billing", label: t.nav.billing },
  ];

  return (
    <div className="flex items-center gap-2 text-sm">
      <nav className="hidden items-center gap-1 md:flex">
        {links.map((l) => {
          const active = pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
                active ? "bg-fg text-bg" : "text-muted hover:bg-sunken hover:text-fg"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <span className="mx-1 hidden text-xs text-muted lg:inline">
        {session.user.email}
      </span>
      <button onClick={handleSignOut} className="btn btn-ghost btn-sm">
        {t.nav.signOut}
      </button>
    </div>
  );
}
