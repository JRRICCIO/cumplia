import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: "Helvetica", color: "#1b1714", lineHeight: 1.5 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  brand: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  logo: { height: 30, objectFit: "contain" },
  h1: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  meta: { fontSize: 9, color: "#a49e93", marginBottom: 18 },
  h2: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 16, marginBottom: 6 },
  p: { marginBottom: 6 },
  quote: { fontSize: 9, color: "#6f6a61", fontStyle: "italic", marginTop: 4 },
  footer: { position: "absolute", bottom: 32, left: 48, right: 48, fontSize: 8, color: "#a49e93", borderTop: "1px solid #eee", paddingTop: 8 },
});

/** Bloques a partir de markdown simple (#, ##, >, y párrafos). */
function parseBlocks(md: string): { type: "h1" | "h2" | "quote" | "p"; text: string }[] {
  const out: { type: "h1" | "h2" | "quote" | "p"; text: string }[] = [];
  for (const rawLine of md.split("\n")) {
    const line = rawLine.trim();
    if (!line || line === "---") continue;
    if (line.startsWith("## ")) out.push({ type: "h2", text: line.slice(3) });
    else if (line.startsWith("# ")) out.push({ type: "h1", text: line.slice(2) });
    else if (line.startsWith("> ")) out.push({ type: "quote", text: line.slice(2) });
    else out.push({ type: "p", text: line.replace(/\*\*/g, "") });
  }
  return out;
}

export interface DocumentPdfData {
  brandName: string;
  logoUrl?: string | null;
  clientName: string;
  title: string;
  contentMd: string;
  version: number;
  status: string;
  generatedAt: string;
}

export async function renderDocumentPDF(data: DocumentPdfData): Promise<Buffer> {
  const blocks = parseBlocks(data.contentMd);
  const doc = (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.brand}>{data.brandName}</Text>
          {data.logoUrl ? <Image style={s.logo} src={data.logoUrl} /> : <Text />}
        </View>
        <Text style={s.h1}>{data.title}</Text>
        <Text style={s.meta}>
          {data.clientName} · versión {data.version} · {data.status === "final" ? "Final" : "Borrador"}
        </Text>
        {blocks.map((b, i) => {
          if (b.type === "h2") return <Text key={i} style={s.h2}>{b.text}</Text>;
          if (b.type === "h1") return <Text key={i} style={s.h2}>{b.text}</Text>;
          if (b.type === "quote") return <Text key={i} style={s.quote}>{b.text}</Text>;
          return <Text key={i} style={s.p}>{b.text}</Text>;
        })}
        <Text style={s.footer}>
          Generado por {data.brandName}. Asistido por IA — no constituye asesoramiento legal.
        </Text>
      </Page>
    </Document>
  );
  return renderToBuffer(doc);
}
