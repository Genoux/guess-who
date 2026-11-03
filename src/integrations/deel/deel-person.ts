import { z } from "zod";

const emailTypeSchema = z.object({ type: z.string(), value: z.string() });

/**
 * Pinned from a read-only probe of `GET /people` (engram `integrations/deel-person-shape`).
 * Fields we do not read are stripped. `hiring_status` stays a string: known values are active,
 * inactive, no_active_contracts, offboarding, onboarding*, onboarded, invited, pending_invite.
 */
export const deelPersonSchema = z.object({
  id: z.string(),
  first_name: z.string().nullish(),
  last_name: z.string().nullish(),
  preferred_first_name: z.string().nullish(),
  preferred_last_name: z.string().nullish(),
  full_name: z.string().nullish(),
  emails: z.array(emailTypeSchema).default([]),
  hiring_status: z.string(),
  start_date: z.string().nullish(),
  country: z.string().nullish(),
  department: z.object({ id: z.string(), name: z.string() }).nullish(),
  client_legal_entity: z.object({ id: z.string(), name: z.string() }).nullish(),
  // Where Deel reports the last working day, depending on the record; see `endDateOf`.
  termination_last_day: z.string().nullish(),
  last_day_of_work_local_date: z.string().nullish(),
  worker_termination_last_date_of_work: z.string().nullish(),
  employments: z.array(z.object({ id: z.string() })).default([]),
});

export type DeelPerson = z.infer<typeof deelPersonSchema>;

export const deelPersonResponseSchema = z.object({ data: deelPersonSchema });

export const deelPeoplePageSchema = z.object({
  data: z.array(deelPersonSchema),
  page: z.object({ total_rows: z.number() }),
});

function emailOfType(person: DeelPerson, type: "work" | "personal"): string | null {
  return person.emails.find((email) => email.type === type)?.value ?? null;
}

export const workEmail = (person: DeelPerson) => emailOfType(person, "work");
export const personalEmail = (person: DeelPerson) => emailOfType(person, "personal");
