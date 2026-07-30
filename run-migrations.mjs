// Corre las migraciones .sql de la app en orden contra $DATABASE_URL.
// Uso: setear DATABASE_URL en el entorno y ejecutar `node run-migrations.mjs`
// (o `npm run migrate`). Registra las aplicadas en schema_migrations para no
// re-correr (aunque cada .sql usa "if not exists" / "on conflict" y es idempotente).
import { Client } from "pg";
import { readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const dir = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(dir, "migrations");

if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL en el entorno.");
  process.exit(1);
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  await client.query(
    `create table if not exists schema_migrations (
       filename text primary key,
       applied_at timestamptz not null default now()
     )`,
  );

  const applied = new Set(
    (await client.query("select filename from schema_migrations")).rows.map(
      (r) => r.filename,
    ),
  );

  for (const f of files) {
    if (applied.has(f)) {
      console.log("··  " + f + " (ya aplicada)");
      continue;
    }
    const sql = readFileSync(join(migrationsDir, f), "utf8");
    await client.query(sql);
    await client.query("insert into schema_migrations (filename) values ($1)", [f]);
    console.log("OK  " + f);
  }
  console.log("\n✅ Migraciones de la app al día.");
} catch (err) {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
