import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Gate liviano: si no hay cookie de sesión, redirige a /login.
 * La verificación completa (sesión + org activa + entitlement) la hacen las
 * páginas y route handlers. Rutas públicas: landing, checker (lead magnet),
 * auth, webhook de Stripe, aceptación de invitaciones y páginas legales.
 */
const PUBLIC_PREFIXES = [
  "/login",
  "/checker",
  "/api/auth",
  "/api/checker",
  "/api/stripe",
  "/accept-invite",
  "/legal",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/" || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
