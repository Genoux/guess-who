import { describe, expect, it } from "vitest";
import {
  ALL_TEAMS,
  matchesPeopleFilter,
  matchesPeopleSearch,
  matchesTeam,
  NO_TEAM,
  teamFilterOptions,
} from "./people-filter";

describe("matchesPeopleFilter", () => {
  it("shows everyone unfiltered", () => {
    expect(matchesPeopleFilter({ asWelcomer: { kind: "cardNotDone" } }, "all")).toBe(true);
  });

  it.each([
    ["canWelcome", { kind: "canWelcome" }, true],
    ["canWelcome", { kind: "cluesMissing", missing: 1 }, false],
    ["clues", { kind: "cluesMissing", missing: 2 }, true],
    ["clues", { kind: "canWelcome" }, false],
    ["clues", { kind: "cardNotDone" }, false],
    ["card", { kind: "cardNotDone" }, true],
    ["card", { kind: "canWelcome" }, false],
  ] as const)("filters %s on how they stand as a welcomer", (filter, asWelcomer, shown) => {
    expect(matchesPeopleFilter({ asWelcomer }, filter)).toBe(shown);
  });
});

describe("matchesPeopleSearch", () => {
  const sam = { name: "Sam Taylor", email: "sam.t@inbeat.agency" };

  it("matches any part of the name or the email, in any case", () => {
    expect(matchesPeopleSearch(sam, "TAYL")).toBe(true);
    expect(matchesPeopleSearch(sam, " inbeat ")).toBe(true);
  });

  it("matches everyone on an empty search, and an invite by its email", () => {
    expect(matchesPeopleSearch(sam, "  ")).toBe(true);
    expect(matchesPeopleSearch({ name: null, email: "kim@gmail.com" }, "kim")).toBe(true);
    expect(matchesPeopleSearch(sam, "zed")).toBe(false);
  });
});

describe("matchesTeam", () => {
  const creative = { team: { name: "Creative", color: "#46BDF0" } };
  const unassigned = { team: null };

  it("shows everyone on all teams", () => {
    expect(matchesTeam(creative, ALL_TEAMS)).toBe(true);
    expect(matchesTeam(unassigned, ALL_TEAMS)).toBe(true);
  });

  it("matches a team by name", () => {
    expect(matchesTeam(creative, "Creative")).toBe(true);
    expect(matchesTeam(creative, "Talent")).toBe(false);
    expect(matchesTeam(unassigned, "Talent")).toBe(false);
  });

  it("matches only people without a team on no team", () => {
    expect(matchesTeam(unassigned, NO_TEAM)).toBe(true);
    expect(matchesTeam(creative, NO_TEAM)).toBe(false);
  });

  it("combines with the filter and the search", () => {
    const sam = {
      name: "Sam Taylor",
      email: "sam@inbeat.agency",
      team: { name: "Talent", color: "#FF97AB" },
      asWelcomer: { kind: "canWelcome" } as const,
    };
    const shown = (team: string, filter: "all" | "card", query: string) =>
      matchesTeam(sam, team) && matchesPeopleFilter(sam, filter) && matchesPeopleSearch(sam, query);
    expect(shown("Talent", "all", "sam")).toBe(true);
    expect(shown("Creative", "all", "sam")).toBe(false);
    expect(shown("Talent", "card", "sam")).toBe(false);
    expect(shown("Talent", "all", "zed")).toBe(false);
  });
});

describe("teamFilterOptions", () => {
  const talent = { team: { name: "Talent", color: "#FF97AB" } };
  const creative = { team: { name: "Creative", color: "#46BDF0" } };

  it("lists all teams first, then each team once, sorted by name, with its color", () => {
    expect(teamFilterOptions([talent, creative, talent])).toEqual([
      { value: ALL_TEAMS, label: "All teams" },
      { value: "Creative", label: "Creative", color: "#46BDF0" },
      { value: "Talent", label: "Talent", color: "#FF97AB" },
    ]);
  });

  it("adds no team last, only when someone has none", () => {
    expect(teamFilterOptions([creative, { team: null }]).at(-1)).toEqual({
      value: NO_TEAM,
      label: "No team",
    });
    expect(teamFilterOptions([creative]).map(({ value }) => value)).not.toContain(NO_TEAM);
  });
});
