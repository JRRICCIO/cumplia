import Link from "next/link";

export default function ModulePlaceholder({
  clientId,
  clientName,
  title,
  phase,
}: {
  clientId: string;
  clientName: string;
  title: string;
  phase: string;
}) {
  return (
    <div className="mx-auto max-w-xl space-y-4 py-10 text-center">
      <Link href={`/clients/${clientId}`} className="text-sm text-muted hover:text-fg">
        ← {clientName}
      </Link>
      <h1 className="font-display text-4xl">{title}</h1>
      <div className="card p-8">
        <p className="text-muted">
          Este módulo se habilita en <strong>{phase}</strong> de la construcción.
        </p>
      </div>
    </div>
  );
}
