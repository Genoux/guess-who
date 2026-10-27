import { describe, expect, it } from "vitest";
import type { Clue } from "../types";
import {
  buildGameClues,
  clueCardState,
  clueDay,
  clueUnlockCopy,
  clueUnlocksIn,
  newestUnreadClue,
  nextClue,
} from "./game-clues";

const game = { id: "game_1", startDate: "2026-11-02" };
const row = (number: number, text: string | null, gameId = "game_1"): Clue => ({
  id: `clue_${number}`,
  gameId,
  number,
  text,
  releaseAt: new Date("2030-01-01T00:00:00Z"),
  createdAt: new Date("2026-11-02T00:00:00Z"),
  updatedAt: new Date("2026-11-02T00:00:00Z"),
});

describe("buildGameClues", () => {
  it("always returns clues 1 to 4 on the schedule", () => {
    const clues = buildGameClues(game, [], "Creative");
    expect(clues.map((clue) => clue.number)).toEqual([1, 2, 3, 4]);
    expect(clues.map((clue) => clue.releaseAt.toISOString())).toEqual([
      "2026-11-04T14:00:00.000Z",
      "2026-11-07T14:00:00.000Z",
      "2026-11-10T14:00:00.000Z",
      "2026-11-13T14:00:00.000Z",
    ]);
  });

  it("generates clue 1 from the welcomer's team and ignores a stored text", () => {
    const [first] = buildGameClues(game, [row(1, "Something else")], "Creative");
    expect(first?.text).toBe("Works in Creative.");
    expect(buildGameClues(game, [], null)[0]?.text).toBeNull();
  });

  it("takes clues 2 to 4 from the welcomer's rows, never from another game", () => {
    const clues = buildGameClues(
      game,
      [row(2, "Has never owned a car"), row(3, "Other game", "game_2")],
      "Creative",
    );
    expect(clues[1]).toMatchObject({ id: "clue_2", text: "Has never owned a car" });
    expect(clues[2]?.text).toBeNull();
    expect(clues[3]?.text).toBeNull();
  });

  it("uses the schedule over a stored release time", () => {
    const [, second] = buildGameClues(game, [row(2, "Text")], "Creative");
    expect(second?.releaseAt.toISOString()).toBe("2026-11-07T14:00:00.000Z");
  });
});

describe("clueCardState", () => {
  it("keeps unreleased clues face down", () => {
    expect(clueCardState({ number: 2, released: false }, 4)).toBe("down");
  });

  it("marks released clues new until read", () => {
    expect(clueCardState({ number: 2, released: true }, 1)).toBe("new");
    expect(clueCardState({ number: 2, released: true }, 2)).toBe("open");
  });
});

describe("newestUnreadClue", () => {
  const clues = [
    { number: 1, released: true },
    { number: 2, released: true },
    { number: 3, released: false },
  ];

  it("picks the highest released clue above the last read one", () => {
    expect(newestUnreadClue(clues, 0)?.number).toBe(2);
    expect(newestUnreadClue(clues, 1)?.number).toBe(2);
  });

  it("returns null when everything released is read", () => {
    expect(newestUnreadClue(clues, 2)).toBeNull();
  });
});

describe("clueDay and nextClue", () => {
  it("maps clue numbers to days", () => {
    expect([1, 2, 3, 4].map(clueDay)).toEqual([3, 6, 9, 12]);
  });

  it("counts the days to the next clue", () => {
    expect(nextClue(game.startDate, new Date("2026-11-07T15:00:00Z"))).toEqual({
      number: 3,
      inDays: 3,
    });
  });

  it("returns null once clue 4 is out", () => {
    expect(nextClue(game.startDate, new Date("2026-11-13T15:00:00Z"))).toBeNull();
  });
});

describe("clueUnlocksIn", () => {
  it("counts the game days until a clue's day", () => {
    const daySix = new Date("2026-11-07T15:00:00Z");
    expect(clueUnlocksIn(3, game.startDate, daySix)).toBe(3);
    expect(clueUnlocksIn(4, game.startDate, daySix)).toBe(6);
  });

  it("is 0 on the clue's own day, before it lands at 9:00", () => {
    expect(clueUnlocksIn(3, game.startDate, new Date("2026-11-10T12:00:00Z"))).toBe(0);
  });
});

describe("clueUnlockCopy", () => {
  it("says when a locked clue opens, relative to today", () => {
    expect([0, 1, 3].map(clueUnlockCopy)).toEqual([
      "Unlocks today",
      "Unlocks tomorrow",
      "Unlocks in 3 days",
    ]);
  });
});
