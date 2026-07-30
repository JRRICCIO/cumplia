import { put, del } from "@vercel/blob";

/**
 * Interfaz de almacenamiento de archivos (evidencias de formación, logo
 * white-label). Hoy sobre Vercel Blob; si algún día el almacenamiento pesa,
 * se cambia SOLO este archivo por Cloudflare R2 / S3 sin tocar el resto de la
 * app. Nadie más importa @vercel/blob directamente.
 */

export interface StoredFile {
  url: string;
  pathname: string;
  size: number;
  contentType: string;
}

/**
 * Sube un archivo y devuelve su URL pública (no adivinable: Blob añade un
 * sufijo aleatorio). `keyPrefix` organiza por org/cliente/entidad.
 */
export async function uploadFile(
  keyPrefix: string,
  filename: string,
  data: Buffer | ArrayBuffer | Blob,
  contentType: string,
): Promise<StoredFile> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "Falta BLOB_READ_WRITE_TOKEN. Creá un store de Vercel Blob y pegá el token en .env.local.",
    );
  }
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const key = `${keyPrefix.replace(/^\/+|\/+$/g, "")}/${safeName}`;
  const blob = await put(key, data as Buffer, {
    access: "public",
    contentType,
    addRandomSuffix: true,
  });
  return {
    url: blob.url,
    pathname: blob.pathname,
    size: (data as Buffer).byteLength ?? 0,
    contentType,
  };
}

export async function deleteFile(url: string): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  await del(url);
}

/** Descarga un archivo almacenado (para empaquetarlo en el ZIP del expediente). */
export async function fetchFileBytes(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar el archivo: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}
