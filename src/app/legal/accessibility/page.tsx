import LegalDoc from "@/components/LegalDoc";

export const metadata = { title: "Accesibilidad" };

export default function AccessibilityPage() {
  return (
    <LegalDoc title="Declaración de accesibilidad">
      <p>
        Trabajamos para que Cumplai sea usable por el mayor número de personas,
        siguiendo las pautas WCAG 2.1 AA en la medida de lo posible.
      </p>
      <h2>Contacto</h2>
      <p>
        Si encontrás una barrera de accesibilidad, escribinos a [completar email] y
        lo corregimos.
      </p>
    </LegalDoc>
  );
}
