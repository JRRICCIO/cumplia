# Cumplai — Hub de cumplimiento del EU AI Act

SaaS en español para que **asesorías/consultoras** (multi-cliente, white-label) y
**pymes que usan IA** armen y mantengan su expediente de cumplimiento del
Reglamento europeo de IA: checker de aplicabilidad, inventario de sistemas con
clasificación de riesgo, registro de formación (Art. 4), documentación generada
con IA y expediente exportable — todo fechado.

Posicionamiento: **no** se vende pánico por el deadline del 2/8/2026. Se vende
*"armá el expediente antes de que llegue la ley española (enforcement real ~2027)"*.

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind v4**
- **Neon** (Postgres serverless) — `@neondatabase/serverless`
- **Better Auth** — identidad + organizaciones (multi-tenant)
- **Anthropic SDK** — generación documental (`claude-opus-4-8`)
- **Vercel Blob** — evidencias de formación + logo white-label
- **Stripe** — suscripciones
- **@react-pdf/renderer** + **jszip** + **docx** — export del expediente

Arquitectura: un solo repo. Núcleo compartido en `src/lib/core/` (agnóstico de
producto); específico del AI Act en `src/lib/ai-act/`. El 2º producto (escáner
EAA) entrará como rutas `/eaa/*` + tablas propias + un valor en la dimensión
`product` de `entitlements`.

## Puesta en marcha

### 1. Dependencias

```bash
npm install
```

### 2. Base de datos (Neon)

Creá un proyecto en [neon.tech](https://neon.tech) y poné la connection string
(pooled, con `?sslmode=require`) en `DATABASE_URL`.

Primero las tablas de **auth**, después las de la **app**:

```bash
npx @better-auth/cli@latest migrate   # crea user/session/organization/...
npm run migrate                        # corre migrations/*.sql en orden
```

### 3. Variables de entorno

```bash
cp .env.local.example .env.local
```

Completá: `DATABASE_URL`, `BETTER_AUTH_SECRET` (`openssl rand -base64 32`),
`BETTER_AUTH_URL`, `ANTHROPIC_API_KEY`, `BLOB_READ_WRITE_TOKEN` (Vercel → Storage
→ Blob), y las claves de Stripe (test) cuando llegues a facturación.

### 4. Desarrollo

```bash
npm run dev
```

### 5. Stripe (cuando llegues a facturación)

1. En [dashboard.stripe.com](https://dashboard.stripe.com) (modo **test**), creá 2
   productos con precios recurrentes mensuales:
   - *Cumplai — Empresa*: 3 precios (29€ / 49€ / 79€).
   - *Cumplai — Asesoría*: 2 precios (99€ / 199€).
2. Copiá los 5 `price_...` a las variables `NEXT_PUBLIC_STRIPE_PRICE_*` de `.env.local`.
3. Webhook local: `stripe listen --forward-to localhost:3000/api/stripe/webhook` y
   pegá el `whsec_...` en `STRIPE_WEBHOOK_SECRET`.
4. Probar: comprar con tarjeta `4242 4242 4242 4242`; el webhook activa el
   entitlement. Reenviá un evento desde el panel de Stripe para verificar
   idempotencia (no debe duplicar).

## Scripts

- `npm run dev` / `build` / `start`
- `npm run typecheck` — `tsc --noEmit`
- `npm run migrate` — aplica las migraciones SQL de la app (idempotente, con
  registro en `schema_migrations`)
- `npm run seed:demo` — siembra 3 clientes demo (verde/ámbar/rojo) en la última
  organización creada (para QA y demos de venta)
- `npm run test:rules` — tests del motor de clasificación

## Estado de construcción — MVP completo (código + build ✅)

Todo el código de las 5 semanas del plan está escrito, tipa (`tsc`) y compila
(`next build`); los tests del motor de reglas pasan (14/14). Falta la
**verificación en vivo** (smoke-test E2E), que requiere una `DATABASE_URL` de Neon
real y —para facturación— las claves de Stripe/Anthropic/Blob.

- **Semana 1 — Fundaciones** ✅ auth + organizaciones, onboarding empresa/asesoría
  (trial 14 días sin tarjeta), CRUD de clientes con cuota, cartera con semáforos,
  equipo, ajustes (marca + logo), storage (Vercel Blob).
- **Semana 2 — Reglas + checker + inventario** ✅ motor de clasificación puro y
  versionado (ruleset v1 en `src/lib/ai-act/seed-v1.ts`, tests en `ruleset.test.ts`),
  checker público (lead magnet con consentimiento RGPD), inventario de sistemas con
  clasificación e historial inmutable.
- **Semana 3 — Formación + documentos** ✅ registro Art. 4 con asistentes,
  evidencias (Blob) y certificado PDF; generación documental con Anthropic
  (política de uso, avisos de transparencia, cláusulas de proveedor), versionada.
- **Semana 4 — Export + Stripe** ✅ export del expediente en ZIP (PDF con
  white-label + CSV de actividad + documentos + evidencias); Stripe checkout +
  portal + webhook idempotente + gating por entitlement.
- **Semana 5 — Pulido + deploy** 🔜 seed demo listo; pendiente smoke-test E2E
  contra Neon y deploy en Vercel.

> ⚠️ El ruleset v1 (`src/lib/ai-act/seed-v1.ts`) es un **borrador jurídico** a
> validar antes de publicar el checker. No constituye asesoramiento legal.

Plan completo: `~/.claude/plans/busca-que-herramienta-legal-lexical-bumblebee.md`.
