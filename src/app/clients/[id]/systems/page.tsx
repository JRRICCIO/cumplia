import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClientAccess } from "@/lib/core/session";
import SystemsPanel from "@/components/SystemsPanel";

export const runtime = "nodejs";

export default async function SystemsPage({
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
        <h1 className="mt-2 font-display text-4xl">Inventario de sistemas</h1>
      </div>
      <SystemsPanel clientId={id} />
    </div>
  );
}
