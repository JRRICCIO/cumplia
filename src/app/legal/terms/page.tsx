import LegalDoc from "@/components/LegalDoc";

export const metadata = { title: "Términos del servicio" };

export default function TermsPage() {
  return (
    <LegalDoc title="Términos del servicio">
      <p>
        Al usar Cumplai aceptás estos términos. La herramienta asiste en la
        organización del expediente de cumplimiento del AI Act pero{" "}
        <strong>no constituye asesoramiento legal</strong> ni sustituye el criterio
        de un profesional.
      </p>
      <h2>Uso</h2>
      <p>
        Sos responsable de la veracidad de los datos que cargás y de las decisiones
        que tomes a partir de la información generada.
      </p>
      <h2>Suscripción</h2>
      <p>
        El acceso a las funciones de pago se rige por el plan contratado. La prueba
        gratuita no requiere tarjeta y caduca a los 14 días.
      </p>
      <h2>Limitación de responsabilidad</h2>
      <p>
        El servicio se presta &quot;tal cual&quot;. Los documentos generados por IA
        pueden contener errores u omisiones; verificalos antes de usarlos.
      </p>
    </LegalDoc>
  );
}
