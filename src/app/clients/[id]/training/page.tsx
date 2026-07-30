import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClientAccess } from "@/lib/core/session";
import TrainingPanel from "@/components/TrainingPanel";

export const runtime = "nodejs";

export default async function TrainingPage({
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
        <h1 className="mt-2 font-display text-4xl">Formación (Art. 4)</h1>
        <p className="mt-1 text-sm text-muted">
          Registro de la alfabetización en IA del personal. Exigible desde el 2/2/2025.
        </p>
      </div>
      <TrainingPanel clientId={id} />
    </div>
  );
}
