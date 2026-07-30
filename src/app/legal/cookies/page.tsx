import LegalDoc from "@/components/LegalDoc";

export const metadata = { title: "Política de cookies" };

export default function CookiesPage() {
  return (
    <LegalDoc title="Política de cookies">
      <p>
        Usamos únicamente cookies técnicas esenciales para el funcionamiento de la
        aplicación (sesión de usuario e idioma). No usamos cookies de publicidad ni
        de analítica de terceros.
      </p>
      <h2>Cookies que usamos</h2>
      <p>
        Cookie de sesión (autenticación) y cookie de idioma (preferencia de locale).
        Al ser esenciales, no requieren consentimiento previo, pero te informamos de
        su uso.
      </p>
    </LegalDoc>
  );
}
