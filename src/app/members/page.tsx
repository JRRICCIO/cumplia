"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { organization, useSession } from "@/lib/core/auth-client";
import { useI18n } from "@/components/I18nProvider";

type Member = {
  id: string;
  role: string;
  user: { email: string; name?: string | null };
};
type Invitation = { id: string; email: string; role: string; status: string };

const ROLE_LABEL: Record<string, string> = {
  owner: "Dueño",
  admin: "Administrador",
  member: "Miembro",
};

export default function MembersPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { data: session, isPending } = useSession();

  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const org = await organization.getFullOrganization();
      setMembers(((org.data?.members ?? []) as Member[]) ?? []);
      const inv = await organization.listInvitations();
      setInvitations(
        ((inv.data ?? []) as Invitation[]).filter((i) => i.status === "pending"),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar miembros.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.push("/login");
      return;
    }
    reload();
  }, [isPending, session, router, reload]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLastInviteLink(null);
    if (!email.trim()) {
      setError("Poné un email.");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await organization.inviteMember({
        email: email.trim(),
        role,
      });
      if (error) throw new Error(error.message || "Error al invitar.");
      const invitationId = (data as { id: string }).id;
      setLastInviteLink(`${window.location.origin}/accept-invite?id=${invitationId}`);
      setEmail("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel(invitationId: string) {
    setBusy(true);
    try {
      await organization.cancelInvitation({ invitationId });
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm("¿Quitar a este miembro de la cuenta?")) return;
    setBusy(true);
    try {
      await organization.removeMember({ memberIdOrEmail: memberId });
      await reload();
    } finally {
      setBusy(false);
    }
  }

  if (isPending || loading) {
    return <p className="py-10 text-sm text-muted">{t.common.loading}</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl">{t.team.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">{t.team.subtitle}</p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <form onSubmit={handleInvite} className="card flex flex-wrap items-center gap-2 p-3">
        <input
          className="input flex-1"
          type="email"
          placeholder="email@colega.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select
          className="input w-auto"
          value={role}
          onChange={(e) => setRole(e.target.value as "member" | "admin")}
        >
          <option value="member">Miembro</option>
          <option value="admin">Administrador</option>
        </select>
        <button type="submit" disabled={busy} className="btn btn-accent btn-sm">
          Invitar
        </button>
      </form>

      {lastInviteLink && (
        <div className="card p-4 text-sm" style={{ background: "var(--accent-soft)" }}>
          <p className="font-semibold">Invitación creada. Compartí este link:</p>
          <code className="mt-1 block break-all text-xs">{lastInviteLink}</code>
          <button
            onClick={() => navigator.clipboard?.writeText(lastInviteLink)}
            className="btn btn-ghost btn-sm mt-2"
          >
            Copiar link
          </button>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-faint">
          Miembros ({members.length})
        </h2>
        <div className="divide-y divide-border">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p>{m.user?.name || m.user?.email}</p>
                <p className="text-xs text-faint">
                  {m.user?.email} · {ROLE_LABEL[m.role] ?? m.role}
                </p>
              </div>
              {m.role !== "owner" && (
                <button
                  onClick={() => handleRemove(m.id)}
                  disabled={busy}
                  className="text-xs text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                >
                  Quitar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {invitations.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-faint">
            Invitaciones pendientes ({invitations.length})
          </h2>
          <div className="divide-y divide-border">
            {invitations.map((i) => (
              <div key={i.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p>{i.email}</p>
                  <p className="text-xs text-faint">
                    {ROLE_LABEL[i.role] ?? i.role} · pendiente
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      navigator.clipboard?.writeText(
                        `${window.location.origin}/accept-invite?id=${i.id}`,
                      )
                    }
                    className="text-xs text-muted hover:underline"
                  >
                    Copiar link
                  </button>
                  <button
                    onClick={() => handleCancel(i.id)}
                    disabled={busy}
                    className="text-xs text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
