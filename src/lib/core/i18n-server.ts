import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, getDict, isLocale, type Locale } from "./i18n";

/** Locale actual leído de la cookie (server components / route handlers). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Diccionario del locale actual (server). */
export async function getServerDict() {
  return getDict(await getLocale());
}
