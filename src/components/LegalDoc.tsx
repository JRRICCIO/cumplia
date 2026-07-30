import Link from "next/link";

/**
 * Envoltorio simple para las páginas legales. El contenido es un placeholder
 * razonable en español; el usuario (abogado) lo reemplaza por el texto final.
 */
export default function LegalDoc({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-2xl space-y-4 py-6">
      <Link href="/" className="text-sm text-muted hover:text-fg">
        ← Inicio
      </Link>
      <h1 className="font-display text-4xl">{title}</h1>
      {updated && <p className="text-xs text-faint">Última actualización: {updated}</p>}
      <div className="space-y-3 text-sm leading-relaxed text-muted [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-fg">
        {children}
      </div>
      <p className="mt-8 rounded-xl bg-accent-soft px-4 py-3 text-xs text-muted">
        Borrador orientativo. Reemplazá este texto por el definitivo antes de publicar.
      </p>
    </article>
  );
}
