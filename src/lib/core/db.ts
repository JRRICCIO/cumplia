import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Cliente de Neon (Postgres serverless) para uso EXCLUSIVO en el servidor.
 * Se usa vía tagged template: sql`select ... where id = ${value}`.
 * El aislamiento multi-tenant se hace en la capa de la app (helpers de session),
 * no con RLS: todo query de expediente pasa por requireClientAccess().
 */
let cached: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (cached) return cached;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Falta DATABASE_URL. Copiá .env.local.example a .env.local y pegá la " +
        "connection string de Neon (con ?sslmode=require).",
    );
  }

  cached = neon(url);
  return cached;
}
