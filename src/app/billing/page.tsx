import { requireOrgId } from "@/lib/core/session";
import { getEntitlement } from "@/lib/core/entitlements";
import { getOrgMeta } from "@/lib/core/org";
import { getServerDict } from "@/lib/core/i18n-server";
import { PLAN_CATALOG, type PlanKey } from "@/lib/core/stripe";
import { SubscribeButton, ManageButton } from "@/components/BillingActions";

export const runtime = "nodejs";

const EMPRESA_PLANS: PlanKey[] = ["empresa_s", "empresa_m", "empresa_l"];
const ASESORIA_PLANS: PlanKey[] = ["asesoria_10", "asesoria_25"];

export default async function BillingPage() {
  const ctx = await requireOrgId();
  const t = await getServerDict();
  const meta = await getOrgMeta(ctx.orgId);
  const ent = await getEntitlement(ctx.orgId, "ai_act");
  const planKeys = meta?.org_type === "asesoria" ? ASESORIA_PLANS : EMPRESA_PLANS;
  const hasCustomer = !!meta?.stripe_customer_id;

  const daysLeft =
    ent?.status === "trialing" && ent.trial_ends_at
      ? Math.max(0, Math.ceil((new Date(ent.trial_ends_at).getTime() - Date.now()) / 86400000))
      : null;

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-6">
      <h1 className="font-display text-4xl">{t.billing.title}</h1>

      <div className="card flex flex-wrap items-center justify-between gap-3 p-6">
        <div>
          {ent?.status === "trialing" && !ent.trialExpired && (
            <p className="text-sm">
              <span className="chip chip-accent mr-2">{t.billing.trialBadge}</span>
              {t.billing.trialDaysLeft.replace("{n}", String(daysLeft ?? 0))}
            </p>
          )}
          {ent?.trialExpired && <p className="text-sm text-danger">{t.billing.trialExpired}</p>}
          {ent?.status === "active" && (
            <p className="text-sm">
              <span className="chip badge-ok mr-2 border-transparent">{t.billing.active}</span>
              {PLAN_CATALOG[ent.plan as PlanKey]?.label ?? ent.plan}
            </p>
          )}
          {ent?.status === "past_due" && <p className="text-sm text-danger">{t.billing.pastDue}</p>}
        </div>
        {hasCustomer && <ManageButton label={t.billing.manage} />}
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-faint">
          {t.billing.choosePlan}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {planKeys.map((key) => {
            const p = PLAN_CATALOG[key];
            return (
              <div key={key} className="card p-6">
                <h3 className="text-lg font-semibold">{p.label.split("·")[1]?.trim() ?? p.label}</h3>
                <p className="mt-1">
                  <span className="font-display text-3xl">{p.amount}</span>
                  <span className="text-sm text-muted">{t.billing.perMonth}</span>
                </p>
                <p className="mt-1 text-xs text-muted">
                  {t.billing.upToClients.replace("{n}", String(p.maxClients))}
                </p>
                <SubscribeButton plan={key} label={t.billing.subscribe} />
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-faint">
          Pagos gestionados por Stripe. Podés cancelar cuando quieras.
        </p>
      </div>
    </div>
  );
}
