import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { Pool } from "pg";

/**
 * Configuración de Better Auth.
 * - Identidad (usuarios, sesiones, cuentas) + organizaciones viven en Neon.
 * - Multi-tenant vía el plugin `organization`: la organización activa es el
 *   tenant que paga (una asesoría O una empresa). Dentro de la org, las
 *   "empresas cliente" son filas de client_companies.
 *
 * Las tablas de auth se crean con: npx @better-auth/cli@latest migrate
 * (ver README). Requiere BETTER_AUTH_SECRET y BETTER_AUTH_URL en el entorno.
 */

function normalize(url?: string | null): string | undefined {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `https://${url}`;
}

/**
 * Orígenes de confianza. En Vercel un proyecto responde en varios alias
 * (`*-git-main-*.vercel.app`, `<proyecto>-<team>.vercel.app`, el dominio de
 * producción, y la URL por-deploy). Los derivamos de las variables que Vercel
 * inyecta automáticamente para que el login funcione en cualquiera de ellos,
 * sin tener que fijar a mano una única URL.
 */
function trustedOrigins(): string[] {
  const origins = new Set<string>();
  const add = (u?: string) => {
    const n = normalize(u);
    if (n) origins.add(n);
  };
  add(process.env.BETTER_AUTH_URL);
  add(process.env.NEXT_PUBLIC_APP_URL);
  add(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  add(process.env.VERCEL_BRANCH_URL);
  add(process.env.VERCEL_URL);
  add("http://localhost:3000");
  return [...origins];
}

const baseURL =
  normalize(process.env.BETTER_AUTH_URL) ??
  normalize(process.env.VERCEL_PROJECT_PRODUCTION_URL);

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  ...(baseURL ? { baseURL } : {}),
  trustedOrigins: trustedOrigins(),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [organization()],
});
