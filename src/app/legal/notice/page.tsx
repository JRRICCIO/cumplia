import LegalDoc from "@/components/LegalDoc";

export const metadata = { title: "Aviso legal" };

export default function NoticePage() {
  return (
    <LegalDoc title="Aviso legal">
      <p>
        Cumplai es una herramienta de software para la gestión del expediente de
        cumplimiento del Reglamento (UE) 2024/1689 (EU AI Act). Titular: [completar
        razón social, NIF y domicilio].
      </p>
      <h2>Objeto</h2>
      <p>
        El sitio facilita el acceso a la aplicación y a información general. El uso
        de la aplicación se rige por los Términos del servicio.
      </p>
      <h2>Contacto</h2>
      <p>[completar email de contacto].</p>
    </LegalDoc>
  );
}
