import { describe, expect, it } from "vitest";
import { matchesPeopleFilter, matchesPeopleSearch } from "./people-filter";

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
