import LegalDoc from "@/components/LegalDoc";

export const metadata = { title: "Política de privacidad" };

export default function PrivacyPage() {
  return (
    <LegalDoc title="Política de privacidad">
      <p>
        Tratamos los datos necesarios para prestar el servicio (cuenta, empresas
        cliente que cargás, evidencias de formación). Responsable: [completar].
      </p>
      <h2>Finalidad y base jurídica</h2>
      <p>
        Ejecución del contrato (art. 6.1.b RGPD) y, para el email opcional del
        checker, tu consentimiento (art. 6.1.a RGPD).
      </p>
      <h2>Conservación</h2>
      <p>
        Conservamos los datos mientras dure la relación y según las obligaciones
        legales aplicables.
      </p>
      <h2>Derechos</h2>
      <p>
        Podés ejercer acceso, rectificación, supresión, oposición, limitación y
        portabilidad escribiendo a [completar email].
      </p>
      <h2>Encargados</h2>
      <p>
        Usamos proveedores como Neon (base de datos), Vercel (hosting y
        almacenamiento) y Anthropic (generación de documentos). [Completar lista y
        garantías de transferencia internacional].
      </p>
    </LegalDoc>
  );
}
