# Deploy de Cumplai en Vercel

El repo ya está inicializado y con el primer commit. Camino recomendado:
**GitHub → Vercel** (conectás una vez, cada `git push` despliega solo).

## 1. Subir el código a GitHub

Creá un repo vacío en [github.com/new](https://github.com/new) (privado),
llamalo `cumplai`, **sin** README/licencia. Después, desde la carpeta del proyecto:

```bash
git branch -M main
git remote add origin https://github.com/TU_USUARIO/cumplai.git
git push -u origin main
```

(Si te pide login, usá un Personal Access Token de GitHub como contraseña.)

## 2. Importar en Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → elegí `cumplai`.
2. Framework: **Next.js** (autodetectado). No cambies build/output.
3. **Antes de dar Deploy**, abrí *Environment Variables* y cargá estas
   (los valores te los paso por chat; NO se commitean):

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | *(tu connection string pooled de Neon)* |
   | `BETTER_AUTH_SECRET` | *(el secreto generado)* |
   | `BETTER_AUTH_URL` | `https://TU-DOMINIO.vercel.app` |
   | `NEXT_PUBLIC_APP_URL` | `https://TU-DOMINIO.vercel.app` |

   `BETTER_AUTH_URL` y `NEXT_PUBLIC_APP_URL` deben ser la URL de producción.
   Si aún no la sabés, poné un placeholder, hacé el primer deploy, copiá la URL
   real (`https://cumplai-xxx.vercel.app`), actualizá las dos variables y
   redeploy (*Deployments → ⋯ → Redeploy*).

4. **Deploy**.

## 3. Variables opcionales (cuando actives cada parte)

- `ANTHROPIC_API_KEY` → generación de documentos.
- `BLOB_READ_WRITE_TOKEN` → evidencias de formación + logo (Vercel → Storage → Blob).
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PRICE_*` → pagos.
- `ANTHROPIC_MODEL` → opcional (default `claude-opus-4-8`).

## 4. Migraciones

Las tablas ya están aplicadas en tu base de Neon (auth + app). Si algún día
cambiás de base o agregás migraciones, corré:

```bash
npx @better-auth/cli@latest migrate --config src/lib/core/auth.ts -y
npm run migrate
```

## Notas

- El **checker público** (`/checker`) funciona sin base de datos (la evaluación
  es server-side pura), así que responde apenas deploya. Login/cartera necesitan
  `DATABASE_URL` + `BETTER_AUTH_*`.
- Webhook de Stripe (producción): creá el endpoint en el panel de Stripe apuntando
  a `https://TU-DOMINIO/api/stripe/webhook` y pegá el `whsec_...` en
  `STRIPE_WEBHOOK_SECRET`.
