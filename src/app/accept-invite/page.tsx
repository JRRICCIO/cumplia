"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { organization, useSession } from "@/lib/core/auth-client";

function AcceptInvite() {
  const router = useRouter();
  const params = useSearchParams();
  const invitationId = params.get("id");
  const { data: session, isPending } = useSession();
  const [status, setStatus] = useState<"working" | "done" | "error">("working");
  const [message, setMessage] = useState("Procesando invitación…");

  useEffect(() => {
    if (isPending) return;
    if (!invitationId) {
      setStatus("error");
      setMessage("Falta el identificador de la invitación.");
      return;
    }
    if (!session?.user) {
      router.push(`/login?redirect=/accept-invite?id=${invitationId}`);
      return;
    }

    organization
      .acceptInvitation({ invitationId })
      .then(({ data, error }) => {
        if (error) throw new Error(error.message || "No se pudo aceptar la invitación.");
        const orgId = (data as { invitation?: { organizationId?: string } })?.invitation
          ?.organizationId;
        return orgId ? organization.setActive({ organizationId: orgId }) : undefined;
      })
      .then(() => {
        setStatus("done");
        setMessage("¡Listo! Te uniste a la cuenta.");
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1200);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Error desconocido.");
      });
  }, [isPending, session, invitationId, router]);

  return (
    <div className="mx-auto max-w-sm space-y-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Invitación</h1>
      <p
        className={
          status === "error"
            ? "text-sm text-red-600 dark:text-red-400"
            : "text-sm text-muted"
        }
      >
        {message}
      </p>
      {status === "error" && (
        <button onClick={() => router.push("/")} className="btn btn-ghost btn-sm">
          Ir al inicio
        </button>
      )}
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-sm">Cargando…</p>}>
      <AcceptInvite />
    </Suspense>
  );
}
