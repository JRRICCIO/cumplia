import { notFound } from "next/navigation";
import { getActiveContext } from "@/lib/core/session";
import { headers } from "next/headers";
import { getSystemForOrg } from "@/lib/ai-act/systems";
import SystemDetail from "@/components/SystemDetail";

export const runtime = "nodejs";

export default async function SystemDetailPage({
  params,
}: {
  params: Promise<{ id: string; systemId: string }>;
}) {
  const { id, systemId } = await params;
  const ctx = await getActiveContext(await headers());
  if (!ctx) notFound();
  const found = await getSystemForOrg(ctx.orgId, systemId);
  if (!found || found.clientId !== id) notFound();

  return <SystemDetail clientId={id} systemId={systemId} />;
}
