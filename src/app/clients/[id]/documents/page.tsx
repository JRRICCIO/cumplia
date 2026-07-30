import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClientAccess } from "@/lib/core/session";
import DocumentsPanel from "@/components/DocumentsPanel";

export const runtime = "nodejs";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireClientAccess(id);
  if (!access) notFound();
  return (
    <div className="space-y-6">
      <div>
        <Link href={`/clients/${id}`} className="text-sm text-muted hover:text-fg">
          ← {access.client.name}
        </Link>
        <h1 className="mt-2 font-display text-4xl">Documentos</h1>
        <p className="mt-1 text-sm text-muted">
          Política de uso de IA, avisos de transparencia y cláusulas para proveedores,
          generados a partir del expediente. Asistido por IA — verificá antes de usar.
        </p>
      </div>
      <DocumentsPanel clientId={id} />
    </div>
  );
}
