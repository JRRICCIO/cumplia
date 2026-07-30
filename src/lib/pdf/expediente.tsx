import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { RiskLevel } from "@/lib/ai-act/types";
import { RISK_LABEL } from "@/lib/ai-act/types";

const s = StyleSheet.create({
  page: { padding: 44, fontSize: 10, fontFamily: "Helvetica", color: "#1b1714", lineHeight: 1.4 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  brand: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  logo: { height: 32, objectFit: "contain" },
  eyebrow: { fontSize: 8, color: "#a49e93", textTransform: "uppercase", letterSpacing: 1 },
  h1: { fontSize: 22, fontFamily: "Helvetica-Bold", marginTop: 4, marginBottom: 4 },
  sub: { fontSize: 10, color: "#6f6a61", marginBottom: 16 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
  h2: { fontSize: 14, fontFamily: "Helvetica-Bold", marginTop: 18, marginBottom: 8, borderBottom: "1px solid #eee", paddingBottom: 4 },
  kv: { flexDirection: "row", marginBottom: 3 },
  k: { width: 110, color: "#6f6a61" },
  v: { flex: 1 },
  card: { border: "1px solid #eee", borderRadius: 6, padding: 10, marginBottom: 8 },
  cardTitle: { fontFamily: "Helvetica-Bold", marginBottom: 2 },
  small: { fontSize: 9, color: "#6f6a61" },
  ob: { fontSize: 9, marginBottom: 2 },
  footer: { position: "absolute", bottom: 28, left: 44, right: 44, fontSize: 8, color: "#a49e93", borderTop: "1px solid #eee", paddingTop: 6 },
});

function fmt(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return d;
  }
}

const STATUS_TEXT: Record<string, { label: string; color: string }> = {
  green: { label: "Al día", color: "#1f9d55" },
  amber: { label: "Incompleto", color: "#c9820a" },
  red: { label: "Sin empezar", color: "#d43f2e" },
};

export interface ExpedienteSystem {
  name: string;
  vendor: string | null;
  role: string;
  risk: RiskLevel | null;
  purpose: string | null;
  obligations: { titulo: string; articulo: string; estado: string }[];
}
export interface ExpedienteTraining {
  title: string;
  provider: string | null;
  date: string | null;
  attendees: number;
}
export interface ExpedienteData {
  brandName: string;
  logoUrl?: string | null;
  clientName: string;
  clientMeta: string;
  status: "green" | "amber" | "red";
  generatedAt: string;
  ruleSetVersion: string | null;
  systems: ExpedienteSystem[];
  trainings: ExpedienteTraining[];
  finalDocs: { title: string; version: number }[];
}

export async function renderExpedientePDF(data: ExpedienteData): Promise<Buffer> {
  const st = STATUS_TEXT[data.status];
  const doc = (
    <Document>
      {/* Portada + índice */}
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.brand}>{data.brandName}</Text>
          {data.logoUrl ? <Image style={s.logo} src={data.logoUrl} /> : <Text />}
        </View>
        <Text style={s.eyebrow}>Expediente de cumplimiento · EU AI Act</Text>
        <Text style={s.h1}>{data.clientName}</Text>
        <Text style={s.sub}>{data.clientMeta || "—"}</Text>
        <View style={s.statusRow}>
          <Text style={{ color: st.color, fontFamily: "Helvetica-Bold" }}>● {st.label}</Text>
          <Text style={s.small}>· Generado el {fmt(data.generatedAt)}</Text>
        </View>

        <Text style={s.h2}>Contenido del expediente</Text>
        <View style={s.kv}><Text style={s.k}>Sistemas de IA</Text><Text style={s.v}>{data.systems.length}</Text></View>
        <View style={s.kv}><Text style={s.k}>Formaciones (Art. 4)</Text><Text style={s.v}>{data.trainings.length}</Text></View>
        <View style={s.kv}><Text style={s.k}>Documentos finales</Text><Text style={s.v}>{data.finalDocs.length}</Text></View>
        <View style={s.kv}><Text style={s.k}>Versión de reglas</Text><Text style={s.v}>{data.ruleSetVersion ?? "—"}</Text></View>

        <Text style={{ ...s.small, marginTop: 20 }}>
          Este expediente reúne el inventario de sistemas de IA, su clasificación de riesgo,
          el registro de formación del personal y los documentos generados. El paquete ZIP
          incluye además los documentos en PDF/Word, las evidencias adjuntas y el registro de
          actividad fechado. Documento orientativo; no constituye asesoramiento legal.
        </Text>
        <Text style={s.footer}>{data.brandName} · Expediente AI Act de {data.clientName}</Text>
      </Page>

      {/* Inventario + clasificaciones */}
      <Page size="A4" style={s.page}>
        <Text style={s.h2}>Inventario de sistemas de IA</Text>
        {data.systems.length === 0 ? (
          <Text style={s.small}>Sin sistemas registrados.</Text>
        ) : (
          data.systems.map((sys, i) => (
            <View key={i} style={s.card}>
              <Text style={s.cardTitle}>{sys.name}</Text>
              <Text style={s.small}>
                {[sys.vendor, sys.purpose, `Rol: ${sys.role}`].filter(Boolean).join(" · ")}
              </Text>
              <Text style={{ ...s.small, marginTop: 2 }}>
                Riesgo: {sys.risk ? RISK_LABEL[sys.risk] : "sin clasificar"}
              </Text>
              {sys.obligations.length > 0 && (
                <View style={{ marginTop: 4 }}>
                  {sys.obligations.map((o, j) => (
                    <Text key={j} style={s.ob}>
                      • {o.titulo} ({o.articulo}, {o.estado})
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
        <Text style={s.footer}>{data.brandName} · Expediente AI Act de {data.clientName}</Text>
      </Page>

      {/* Formación + documentos */}
      <Page size="A4" style={s.page}>
        <Text style={s.h2}>Formación (Art. 4)</Text>
        {data.trainings.length === 0 ? (
          <Text style={s.small}>Sin formaciones registradas.</Text>
        ) : (
          data.trainings.map((tr, i) => (
            <View key={i} style={s.card}>
              <Text style={s.cardTitle}>{tr.title}</Text>
              <Text style={s.small}>
                {[tr.provider, fmt(tr.date), `${tr.attendees} asistentes`].filter(Boolean).join(" · ")}
              </Text>
            </View>
          ))
        )}

        <Text style={s.h2}>Documentos finales</Text>
        {data.finalDocs.length === 0 ? (
          <Text style={s.small}>Sin documentos finalizados. (Incluidos aparte los borradores en el ZIP.)</Text>
        ) : (
          data.finalDocs.map((d, i) => (
            <Text key={i} style={{ marginBottom: 3 }}>• {d.title} (v{d.version})</Text>
          ))
        )}
        <Text style={s.footer}>{data.brandName} · Expediente AI Act de {data.clientName}</Text>
      </Page>
    </Document>
  );
  return renderToBuffer(doc);
}
