import { describe, expect, it } from "vitest";
import { cluesReady, missingFor, sortByMissing } from "./welcomer-readiness";

describe("cluesReady", () => {
  it("needs clues 2, 3 and 4", () => {
    expect(cluesReady([2, 3, 4])).toBe(true);
    expect(cluesReady([4, 2, 3])).toBe(true);
    expect(cluesReady([2, 3])).toBe(false);
    expect(cluesReady([])).toBe(false);
  });
});

describe("missingFor", () => {
  const finished = { teamId: "team_1", ask: "Night trains" };

  it("says the card comes first", () => {
    expect(missingFor({ teamId: null, ask: "Night trains" }, [2, 3, 4])).toEqual({
      kind: "card",
      label: "Card not finished",
    });
    expect(missingFor({ teamId: "team_1", ask: " " }, [])).toMatchObject({ kind: "card" });
  });

  it("counts the clues written when the card is done", () => {
    expect(missingFor(finished, [2])).toEqual({ kind: "clues", written: 1, label: "1 of 3 clues" });
    expect(missingFor(finished, [])).toEqual({ kind: "clues", written: 0, label: "0 of 3 clues" });
  });

  it("has nothing missing for a card and all three clues", () => {
    expect(missingFor(finished, [2, 3, 4])).toBeNull();
  });
});

describe("sortByMissing", () => {
  const entry = (name: string, kind: "card" | "clues", written = 0) => ({
    name,
    missing: { kind, written, label: "" } as const,
  });

  it("puts unfinished cards first, then the fewest clues, then by name", () => {
    const sorted = sortByMissing([
      entry("Zed", "clues", 2),
      entry("Bea", "clues", 0),
      entry("Ana", "clues", 0),
      entry("Cleo", "card"),
      entry("Dan", "clues", 1),
    ]);
    expect(sorted.map(({ name }) => name)).toEqual(["Cleo", "Ana", "Bea", "Dan", "Zed"]);
  });
});
