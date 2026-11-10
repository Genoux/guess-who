import { describe, expect, it } from "vitest";
import { hasOwnCardFields, isCardComplete } from "./card";

const complete = { teamId: "team_1", location: "Montréal", fact: "Bakes bread", ask: "Sourdough" };

describe("isCardComplete", () => {
  it("is true when team, location, fact and ask are all filled", () => {
    expect(isCardComplete(complete)).toBe(true);
  });

  it.each([
    { teamId: null },
    { location: null },
    { location: "   " },
    { fact: null },
    { fact: "" },
    { ask: null },
    { ask: " \n" },
  ])("is false when a field is missing or blank (%o)", (missing) => {
    expect(isCardComplete({ ...complete, ...missing })).toBe(false);
  });
});

describe("hasOwnCardFields", () => {
  const own = { teamId: "team_1", fact: "Bakes bread", ask: "Sourdough" };

  it("is true when team, fact and ask are filled, whatever Deel has set", () => {
    expect(hasOwnCardFields(own)).toBe(true);
  });

  it("is false when the team is unpicked or the fact or the ask is blank", () => {
    expect(hasOwnCardFields({ ...own, teamId: null })).toBe(false);
    expect(hasOwnCardFields({ ...own, fact: "  " })).toBe(false);
    expect(hasOwnCardFields({ ...own, ask: null })).toBe(false);
  });
});
