import type { RiskLevel } from "@/lib/ai-act/types";
import { RISK_LABEL } from "@/lib/ai-act/types";

const STYLE: Record<RiskLevel, string> = {
  prohibido: "badge-danger",
  alto_riesgo: "badge-danger",
  alto_riesgo_aplazado: "badge-warn",
  transparencia: "badge-warn",
  minimo: "badge-ok",
};

export default function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={`chip ${STYLE[level]} border-transparent font-semibold`}>
      {RISK_LABEL[level]}
    </span>
  );
}
