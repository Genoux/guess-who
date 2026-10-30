import { describe, expect, it } from "vitest";
import {
  asWelcomer,
  asWelcomerLabel,
  canTurnOn,
  canWelcome,
  cluesReady,
} from "./welcomer-readiness";

describe("cluesReady", () => {
  it("needs clues 2, 3 and 4", () => {
    expect(cluesReady([2, 3, 4])).toBe(true);
    expect(cluesReady([4, 2, 3])).toBe(true);
    expect(cluesReady([2, 3])).toBe(false);
    expect(cluesReady([])).toBe(false);
  });
});

describe("asWelcomer", () => {
  const finished = { hasTeam: true, ask: "Night trains" };

  it("puts the card first: no team or no ask line means it is not done", () => {
    expect(asWelcomer({ hasTeam: false, ask: "Night trains" }, 3)).toEqual({ kind: "cardNotDone" });
    expect(asWelcomer({ hasTeam: true, ask: "  " }, 3)).toEqual({ kind: "cardNotDone" });
    expect(asWelcomer({ hasTeam: true, ask: null }, 0)).toEqual({ kind: "cardNotDone" });
  });

  it("counts the clues still missing once the card is done", () => {
    expect(asWelcomer(finished, 2)).toEqual({ kind: "cluesMissing", missing: 1 });
    expect(asWelcomer(finished, 0)).toEqual({ kind: "cluesMissing", missing: 3 });
  });

  it("can welcome with a card and all three clues", () => {
    expect(asWelcomer(finished, 3)).toEqual({ kind: "canWelcome" });
  });
});

describe("asWelcomerLabel", () => {
  it("speaks in plain words", () => {
    expect(asWelcomerLabel({ kind: "canWelcome" })).toBe("Can welcome");
    expect(asWelcomerLabel({ kind: "cardNotDone" })).toBe("Card not done");
    expect(asWelcomerLabel({ kind: "cluesMissing", missing: 1 })).toBe("1 clue missing");
    expect(asWelcomerLabel({ kind: "cluesMissing", missing: 2 })).toBe("2 clues missing");
  });
});

describe("canTurnOn", () => {
  it("lets a teammate through only when they can welcome", () => {
    expect(canTurnOn({ newHire: false, asWelcomer: { kind: "canWelcome" } })).toBe(true);
    expect(canTurnOn({ newHire: false, asWelcomer: { kind: "cardNotDone" } })).toBe(false);
    expect(canTurnOn({ newHire: false, asWelcomer: { kind: "cluesMissing", missing: 1 } })).toBe(
      false,
    );
  });

  it("lets a new hire through whatever their card and clues look like", () => {
    expect(canTurnOn({ newHire: true, asWelcomer: { kind: "cardNotDone" } })).toBe(true);
  });
});

describe("canWelcome", () => {
  it("is only true for a finished card with all three clues", () => {
    expect(canWelcome({ kind: "canWelcome" })).toBe(true);
    expect(canWelcome({ kind: "cluesMissing", missing: 1 })).toBe(false);
    expect(canWelcome({ kind: "cardNotDone" })).toBe(false);
  });
});
