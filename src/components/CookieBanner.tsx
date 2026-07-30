"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";

const COOKIE = "cookie-notice";

export default function CookieBanner() {
  const { t } = useI18n();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!document.cookie.split("; ").some((c) => c.startsWith(`${COOKIE}=`))) {
      setShow(true);
    }
  }, []);

  function accept() {
    document.cookie = `${COOKIE}=1; path=/; max-age=31536000; samesite=lax`;
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="card mx-auto flex max-w-3xl flex-col items-center gap-3 p-4 text-sm sm:flex-row sm:justify-between">
        <p className="text-muted">
          {t.common.cookieText}{" "}
          <Link href="/legal/cookies" className="link text-fg">
            {t.common.cookieMore}
          </Link>
        </p>
        <button onClick={accept} className="btn btn-accent btn-sm shrink-0">
          {t.common.cookieOk}
        </button>
      </div>
    </div>
  );
}
