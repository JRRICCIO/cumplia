import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getActiveContext } from "@/lib/core/session";
import { getTrainingForOrg } from "@/lib/ai-act/training";
import TrainingDetail from "@/components/TrainingDetail";

export const runtime = "nodejs";

export default async function TrainingDetailPage({
  params,
}: {
  params: Promise<{ id: string; trainingId: string }>;
}) {
  const { id, trainingId } = await params;
  const ctx = await getActiveContext(await headers());
  if (!ctx) notFound();
  const found = await getTrainingForOrg(ctx.orgId, trainingId);
  if (!found || found.clientId !== id) notFound();
  return <TrainingDetail clientId={id} trainingId={trainingId} />;
}
