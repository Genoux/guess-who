import type { GameFilterOption } from "@/shared/components/game/game-filter-menu";
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

export const ALL_TEAMS = "all";
export const NO_TEAM = "none";

type WithTeam = { team: { name: string; color: string } | null };

export const matchesTeam = ({ team }: WithTeam, selected: string) =>
  selected === ALL_TEAMS || (selected === NO_TEAM ? team === null : team?.name === selected);

/** All teams, each team among these people by name, and No team when someone has none. */
export function teamFilterOptions(people: readonly WithTeam[]): GameFilterOption<string>[] {
  const teams = new Map(people.flatMap(({ team }) => (team ? [[team.name, team.color]] : [])));
  return [
    { value: ALL_TEAMS, label: "All teams" },
    ...[...teams]
      .sort(([first], [second]) => first.localeCompare(second, "en"))
      .map(([name, color]) => ({ value: name, label: name, color })),
    ...(people.some(({ team }) => team === null) ? [{ value: NO_TEAM, label: "No team" }] : []),
  ];
}
