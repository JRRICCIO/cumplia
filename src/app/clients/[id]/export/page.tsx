import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClientAccess } from "@/lib/core/session";

export const runtime = "nodejs";

export default async function ExportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireClientAccess(id);
  if (!access) notFound();
  return (
    <div className="mx-auto max-w-xl space-y-6 py-6">
      <div>
        <Link href={`/clients/${id}`} className="text-sm text-muted hover:text-fg">
          ← {access.client.name}
        </Link>
        <h1 className="mt-2 font-display text-4xl">Exportar expediente</h1>
      </div>
      <div className="card p-8 text-center">
        <p className="text-muted">
          Descargá el expediente completo en un ZIP: portada con tu marca, inventario y
          clasificaciones, formación del personal, documentos generados y el registro de
          actividad fechado.
        </p>
        <a href={`/api/clients/${id}/export`} className="btn btn-accent mt-6">
          Descargar expediente (ZIP)
        </a>
        <p className="mt-4 text-xs text-faint">
          Documento orientativo; no constituye asesoramiento legal.
        </p>
      </div>
    </div>
  );
}
