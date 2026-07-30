import { NextResponse } from "next/server";
import { getActiveContext } from "@/lib/core/session";
import { addAttendee, getTrainingForOrg } from "@/lib/ai-act/training";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await getActiveContext(request.headers);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const found = await getTrainingForOrg(ctx.orgId, id);
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "name_required" }, { status: 400 });

  const attendee = await addAttendee(id, {
    name: name.slice(0, 200),
    email: (body.email as string)?.trim() || null,
    role: (body.role as string)?.trim() || null,
  });
  return NextResponse.json({ attendee }, { status: 201 });
}
