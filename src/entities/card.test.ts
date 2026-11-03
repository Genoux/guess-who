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
  it("is true when fact and ask are filled, whatever Deel has set", () => {
    expect(hasOwnCardFields({ fact: "Bakes bread", ask: "Sourdough" })).toBe(true);
  });

  it("is false when the fact or the ask is blank", () => {
    expect(hasOwnCardFields({ fact: "  ", ask: "Sourdough" })).toBe(false);
    expect(hasOwnCardFields({ fact: "Bakes bread", ask: null })).toBe(false);
  });
});
