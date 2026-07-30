import { getSql } from "./db";

export interface Attachment {
  id: string;
  client_company_id: string;
  entity_type: string;
  entity_id: string | null;
  filename: string;
  mime: string | null;
  size_bytes: number | null;
  blob_url: string;
  created_at: string;
}

export async function createAttachment(input: {
  clientCompanyId: string;
  entityType: string;
  entityId: string | null;
  filename: string;
  mime: string | null;
  sizeBytes: number | null;
  blobUrl: string;
}): Promise<Attachment> {
  const sql = getSql();
  const rows = (await sql`
    insert into attachments
      (client_company_id, entity_type, entity_id, filename, mime, size_bytes, blob_url)
    values
      (${input.clientCompanyId}, ${input.entityType}, ${input.entityId},
       ${input.filename}, ${input.mime}, ${input.sizeBytes}, ${input.blobUrl})
    returning id, client_company_id, entity_type, entity_id, filename, mime,
              size_bytes, blob_url, created_at
  `) as Attachment[];
  return rows[0];
}

export async function listAttachments(
  entityType: string,
  entityId: string,
): Promise<Attachment[]> {
  const sql = getSql();
  return (await sql`
    select id, client_company_id, entity_type, entity_id, filename, mime,
           size_bytes, blob_url, created_at
    from attachments
    where entity_type = ${entityType} and entity_id = ${entityId}
    order by created_at asc
  `) as Attachment[];
}
