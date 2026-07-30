import { notFound } from "next/navigation";
import { requireClientAccess } from "@/lib/core/session";
import NewSystemFlow from "@/components/NewSystemFlow";

export const runtime = "nodejs";

export default async function NewSystemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireClientAccess(id);
  if (!access) notFound();
  return <NewSystemFlow clientId={id} clientName={access.client.name} />;
}
