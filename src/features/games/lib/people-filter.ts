import type { AsWelcomer } from "./welcomer-readiness";

/** How the No mission view's filter menu reads, in order; the first is the unfiltered one. */
export const PEOPLE_FILTERS = [
  { value: "all", label: "All" },
  { value: "canWelcome", label: "Can welcome" },
  { value: "clues", label: "Clues missing" },
  { value: "card", label: "Card not done" },
] as const;

export type PeopleFilter = (typeof PEOPLE_FILTERS)[number]["value"];

type Filterable = { asWelcomer: AsWelcomer };

const PREDICATES: Record<PeopleFilter, (person: Filterable) => boolean> = {
  all: () => true,
  canWelcome: ({ asWelcomer }) => asWelcomer.kind === "canWelcome",
  clues: ({ asWelcomer }) => asWelcomer.kind === "cluesMissing",
  card: ({ asWelcomer }) => asWelcomer.kind === "cardNotDone",
};

export const matchesPeopleFilter = (person: Filterable, filter: PeopleFilter) =>
  PREDICATES[filter](person);

export function matchesPeopleSearch(
  { name, email }: { name: string | null; email: string },
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  return needle === "" || `${name ?? ""} ${email}`.toLowerCase().includes(needle);
}
