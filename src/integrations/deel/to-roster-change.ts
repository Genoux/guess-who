import "server-only";
import { normalizeEmail } from "@inbeat/core/email";
import { type TeamName, teamForDeelDepartment } from "@/entities/teams";
import { type DeelPerson, personalEmail, workEmail } from "./deel-person";

/** The Deel-owned fields of a person; the upsert writes exactly these. */
export type RosterPerson = {
  deelId: string;
  name: string;
  team: TeamName | null;
  location: string | null;
  /** The work email, else the personal one. Normalized. */
  email: string;
  /** The personal email, only when it differs from `email`. */
  personalEmail: string | null;
  /** `YYYY-MM-DD`. */
  startDate: string | null;
};

export type RosterChange =
  | { kind: "upsert"; person: RosterPerson }
  | { kind: "remove"; deelId: string }
  | { kind: "ignore"; reason: string };

const LEAVER_STATUSES = new Set(["inactive", "no_active_contracts"]);

// The four legal entities (IB, CM, CA, AAG). Names are compared without case, accents or
// punctuation because Deel's own spelling drifts ("inc" vs "INC.").
const SCOPE_ENTITIES = [
  "9434-1641 QUEBEC INC.",
  "9490-4943 Québec inc DBA Creative Milkshake",
  "CONTENT ALLIES, INC.",
  "Waving Banner, LLC",
];

const comparableName = (name: string) =>
  name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const SCOPE_KEYS = new Set(SCOPE_ENTITIES.map(comparableName));

const countryNames = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });

function countryName(code: string | null | undefined): string | null {
  if (!code) return null;
  try {
    return countryNames.of(code.toUpperCase()) ?? null;
  } catch {
    return null;
  }
}

function personName(person: DeelPerson): string {
  const composed = [
    person.preferred_first_name || person.first_name,
    person.preferred_last_name || person.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  return composed || person.full_name?.trim() || "";
}

function dateOnly(value: string | null | undefined): string | null {
  return value?.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
}

/**
 * Classifies a re-fetched Deel person (`null` when Deel no longer knows the id). Leavers are
 * checked before scope: removing an unknown or out-of-scope id is a no-op downstream.
 */
export function toRosterChange(deelId: string, person: DeelPerson | null): RosterChange {
  if (!person || LEAVER_STATUSES.has(person.hiring_status)) return { kind: "remove", deelId };
  if (person.hiring_status !== "active") return { kind: "ignore", reason: "not active or leaver" };

  const entity = person.client_legal_entity?.name;
  if (!entity || !SCOPE_KEYS.has(comparableName(entity))) {
    return { kind: "ignore", reason: "out of scope" };
  }

  const work = workEmail(person);
  const personal = personalEmail(person);
  const email = normalizeEmail(work ?? personal ?? "");
  if (!email) return { kind: "ignore", reason: "no email" };

  const name = personName(person);
  if (!name) return { kind: "ignore", reason: "no name" };

  const personalNormalized = personal ? normalizeEmail(personal) : null;
  return {
    kind: "upsert",
    person: {
      deelId,
      name,
      team: person.department ? teamForDeelDepartment(person.department.name) : null,
      location: countryName(person.country),
      email,
      personalEmail: personalNormalized && personalNormalized !== email ? personalNormalized : null,
      startDate: dateOnly(person.start_date),
    },
  };
}
