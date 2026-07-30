import { NextResponse } from "next/server";
import { getActiveContext } from "@/lib/core/session";
import { getTrainingForOrg, removeAttendee } from "@/lib/ai-act/training";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; attendeeId: string }> },
) {
  const { id, attendeeId } = await params;
  const ctx = await getActiveContext(request.headers);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const found = await getTrainingForOrg(ctx.orgId, id);
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await removeAttendee(id, attendeeId);
  return NextResponse.json({ ok: true });
}
