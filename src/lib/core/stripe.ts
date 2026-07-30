import Stripe from "stripe";
import type { OrgType } from "./org";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Falta STRIPE_SECRET_KEY en el entorno.");
  cached = new Stripe(key);
  return cached;
}

export type PlanKey =
  | "empresa_s"
  | "empresa_m"
  | "empresa_l"
  | "asesoria_10"
  | "asesoria_25";

interface PlanDef {
  priceEnv: string;
  maxClients: number;
  orgType: OrgType;
  label: string;
  amount: string;
}

/**
 * Catálogo de planes. El price id se resuelve desde env (creado en Stripe).
 * El webhook confía en la metadata del price/checkout, no en estos valores;
 * esto sirve para armar la página de precios y el checkout.
 */
export const PLAN_CATALOG: Record<PlanKey, PlanDef> = {
  empresa_s: { priceEnv: "NEXT_PUBLIC_STRIPE_PRICE_EMPRESA_S", maxClients: 1, orgType: "empresa", label: "Empresa · Pequeña", amount: "29€" },
  empresa_m: { priceEnv: "NEXT_PUBLIC_STRIPE_PRICE_EMPRESA_M", maxClients: 1, orgType: "empresa", label: "Empresa · Mediana", amount: "49€" },
  empresa_l: { priceEnv: "NEXT_PUBLIC_STRIPE_PRICE_EMPRESA_L", maxClients: 1, orgType: "empresa", label: "Empresa · Grande", amount: "79€" },
  asesoria_10: { priceEnv: "NEXT_PUBLIC_STRIPE_PRICE_ASESORIA_10", maxClients: 10, orgType: "asesoria", label: "Asesoría · hasta 10", amount: "99€" },
  asesoria_25: { priceEnv: "NEXT_PUBLIC_STRIPE_PRICE_ASESORIA_25", maxClients: 25, orgType: "asesoria", label: "Asesoría · hasta 25", amount: "199€" },
};

export function planFromKey(plan: string): { key: PlanKey; def: PlanDef } | null {
  if (plan in PLAN_CATALOG) {
    return { key: plan as PlanKey, def: PLAN_CATALOG[plan as PlanKey] };
  }
  return null;
}

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
