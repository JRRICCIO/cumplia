import type { Obligation } from "@/lib/ai-act/types";

export default function ObligationsList({ obligations }: { obligations: Obligation[] }) {
  if (obligations.length === 0) {
    return <p className="text-sm text-muted">Sin obligaciones específicas detectadas.</p>;
  }
  return (
    <ul className="space-y-3">
      {obligations.map((o) => (
        <li key={o.code} className="card-flat p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{o.titulo}</span>
            <span className="chip text-[11px]">{o.articulo}</span>
            <span
              className={`chip text-[11px] ${
                o.estado === "aplazado" ? "badge-warn" : "badge-ok"
              } border-transparent`}
            >
              {o.estado === "aplazado" ? "Aplazado" : "Vigente"}
            </span>
          </div>
          <p className="mt-1 text-xs text-faint">{o.vigencia}</p>
          <p className="mt-2 text-sm text-muted">{o.resumen}</p>
          <p className="mt-1 text-sm">
            <span className="font-medium">Acción: </span>
            {o.accion}
          </p>
        </li>
      ))}
    </ul>
  );
}
