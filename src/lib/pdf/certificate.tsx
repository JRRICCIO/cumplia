import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { Training, Attendee } from "@/lib/ai-act/training";

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: "Helvetica", color: "#1b1714" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  brand: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  logo: { height: 36, objectFit: "contain" },
  eyebrow: { fontSize: 8, color: "#a49e93", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  sub: { fontSize: 11, color: "#6f6a61", marginBottom: 24 },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: 130, color: "#6f6a61" },
  value: { flex: 1, fontFamily: "Helvetica-Bold" },
  sectionTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 20, marginBottom: 8 },
  attendee: { flexDirection: "row", paddingVertical: 4, borderBottom: "1px solid #eee" },
  aName: { flex: 2, fontFamily: "Helvetica-Bold" },
  aMeta: { flex: 2, color: "#6f6a61" },
  footer: { position: "absolute", bottom: 32, left: 48, right: 48, fontSize: 8, color: "#a49e93", borderTop: "1px solid #eee", paddingTop: 8 },
});

function fmtDate(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return d;
  }
}

export interface CertificateData {
  brandName: string;
  logoUrl?: string | null;
  clientName: string;
  training: Training;
  attendees: Attendee[];
  generatedAt: string; // ISO
}

export async function renderCertificatePDF(data: CertificateData): Promise<Buffer> {
  const doc = (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.brand}>{data.brandName}</Text>
          {data.logoUrl ? <Image style={s.logo} src={data.logoUrl} /> : <Text />}
        </View>

        <Text style={s.eyebrow}>Registro de formación · EU AI Act (Art. 4)</Text>
        <Text style={s.title}>Certificado de formación en IA</Text>
        <Text style={s.sub}>
          Constancia interna de la formación en alfabetización de IA impartida al personal
          de {data.clientName}.
        </Text>

        <View style={s.row}>
          <Text style={s.label}>Empresa</Text>
          <Text style={s.value}>{data.clientName}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Formación</Text>
          <Text style={s.value}>{data.training.title}</Text>
        </View>
        {data.training.provider ? (
          <View style={s.row}>
            <Text style={s.label}>Proveedor</Text>
            <Text style={s.value}>{data.training.provider}</Text>
          </View>
        ) : null}
        <View style={s.row}>
          <Text style={s.label}>Fecha</Text>
          <Text style={s.value}>{fmtDate(data.training.training_date)}</Text>
        </View>
        {data.training.duration_minutes ? (
          <View style={s.row}>
            <Text style={s.label}>Duración</Text>
            <Text style={s.value}>{data.training.duration_minutes} min</Text>
          </View>
        ) : null}
        {data.training.description ? (
          <View style={s.row}>
            <Text style={s.label}>Contenido</Text>
            <Text style={s.value}>{data.training.description}</Text>
          </View>
        ) : null}

        <Text style={s.sectionTitle}>Personal formado ({data.attendees.length})</Text>
        {data.attendees.length === 0 ? (
          <Text style={{ color: "#6f6a61" }}>Sin asistentes registrados.</Text>
        ) : (
          data.attendees.map((a) => (
            <View key={a.id} style={s.attendee}>
              <Text style={s.aName}>{a.person_name}</Text>
              <Text style={s.aMeta}>{[a.person_role, a.person_email].filter(Boolean).join(" · ")}</Text>
            </View>
          ))
        )}

        <Text style={s.footer}>
          Documento interno de registro emitido por {data.brandName} el {fmtDate(data.generatedAt)}.
          No constituye asesoramiento legal.
        </Text>
      </Page>
    </Document>
  );
  return renderToBuffer(doc);
}
