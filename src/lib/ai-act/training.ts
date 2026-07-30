import { getSql } from "@/lib/core/db";

export interface Training {
  id: string;
  client_company_id: string;
  title: string;
  description: string | null;
  provider: string | null;
  training_date: string | null;
  duration_minutes: number | null;
  created_at: string;
}

export interface Attendee {
  id: string;
  training_id: string;
  person_name: string;
  person_email: string | null;
  person_role: string | null;
  created_at: string;
}

export async function listTrainings(clientId: string): Promise<Training[]> {
  const sql = getSql();
  return (await sql`
    select id, client_company_id, title, description, provider, training_date,
           duration_minutes, created_at
    from trainings
    where client_company_id = ${clientId}
    order by training_date desc nulls last, created_at desc
  `) as Training[];
}

export async function getTrainingForOrg(
  orgId: string,
  trainingId: string,
): Promise<{ training: Training; clientId: string; clientName: string } | null> {
  const sql = getSql();
  const rows = (await sql`
    select t.id, t.client_company_id, t.title, t.description, t.provider,
           t.training_date, t.duration_minutes, t.created_at, c.name as client_name
    from trainings t
    join client_companies c on c.id = t.client_company_id
    where t.id = ${trainingId} and c.org_id = ${orgId} and c.archived_at is null
    limit 1
  `) as (Training & { client_name: string })[];
  if (rows.length === 0) return null;
  const { client_name, ...training } = rows[0];
  return { training, clientId: training.client_company_id, clientName: client_name };
}

export async function createTraining(
  clientId: string,
  input: {
    title: string;
    description?: string | null;
    provider?: string | null;
    trainingDate?: string | null;
    durationMinutes?: number | null;
  },
): Promise<Training> {
  const sql = getSql();
  const rows = (await sql`
    insert into trainings (client_company_id, title, description, provider, training_date, duration_minutes)
    values (${clientId}, ${input.title}, ${input.description ?? null}, ${input.provider ?? null},
            ${input.trainingDate ?? null}, ${input.durationMinutes ?? null})
    returning id, client_company_id, title, description, provider, training_date,
              duration_minutes, created_at
  `) as Training[];
  return rows[0];
}

export async function deleteTraining(clientId: string, trainingId: string): Promise<void> {
  const sql = getSql();
  await sql`delete from trainings where id = ${trainingId} and client_company_id = ${clientId}`;
}

export async function listAttendees(trainingId: string): Promise<Attendee[]> {
  const sql = getSql();
  return (await sql`
    select id, training_id, person_name, person_email, person_role, created_at
    from training_attendees where training_id = ${trainingId}
    order by created_at asc
  `) as Attendee[];
}

export async function addAttendee(
  trainingId: string,
  input: { name: string; email?: string | null; role?: string | null },
): Promise<Attendee> {
  const sql = getSql();
  const rows = (await sql`
    insert into training_attendees (training_id, person_name, person_email, person_role)
    values (${trainingId}, ${input.name}, ${input.email ?? null}, ${input.role ?? null})
    returning id, training_id, person_name, person_email, person_role, created_at
  `) as Attendee[];
  return rows[0];
}

export async function removeAttendee(trainingId: string, attendeeId: string): Promise<void> {
  const sql = getSql();
  await sql`delete from training_attendees where id = ${attendeeId} and training_id = ${trainingId}`;
}
