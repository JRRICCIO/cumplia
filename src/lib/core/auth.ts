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
export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [organization()],
});
