import { describe, expect, it } from "vitest";
import {
  DEV_STATE_DEFAULT,
  type DevState,
  devFieldEnabled,
  devOptionDisabled,
  normalizeDevState,
  releasedClueCount,
  seedDay,
} from "./dev-state";

const state = (overrides: Partial<DevState>): DevState => ({ ...DEV_STATE_DEFAULT, ...overrides });

describe("releasedClueCount", () => {
  it("counts the clues out by a game day", () => {
    expect([1, 2, 3, 5, 6, 11, 12, 14].map(releasedClueCount)).toEqual([0, 0, 1, 1, 2, 3, 4, 4]);
  });
});

describe("seedDay", () => {
  it("plays the chosen day, and day 15 once the game was revealed", () => {
    expect(seedDay(state({ day: 7 }))).toBe(7);
    expect(seedDay(state({ outcome: "revealed", day: 7 }))).toBe(15);
  });
});

describe("devFieldEnabled", () => {
  it("offers a teammate only their card", () => {
    const teammate = state({ view: "teammate" });
    expect(devFieldEnabled(teammate, "card")).toBe(true);
    for (const field of ["outcome", "day", "cluesWritten", "cluesRead", "album", "introSeen"]) {
      expect(devFieldEnabled(teammate, field as keyof DevState)).toBe(false);
    }
  });

  it("offers a welcomer the game, the clues they wrote and their card, not the player's progress", () => {
    const welcomer = state({ view: "welcomer" });
    expect(devFieldEnabled(welcomer, "outcome")).toBe(true);
    expect(devFieldEnabled(welcomer, "cluesWritten")).toBe(true);
    expect(devFieldEnabled(welcomer, "card")).toBe(true);
    expect(devFieldEnabled(welcomer, "cluesRead")).toBe(false);
    expect(devFieldEnabled(welcomer, "album")).toBe(false);
  });

  it("keeps a new hire mid-game off their card and lets them make it once the game ends", () => {
    expect(devFieldEnabled(state({ view: "new-hire", outcome: "active" }), "card")).toBe(false);
    expect(devFieldEnabled(state({ view: "new-hire", outcome: "found" }), "card")).toBe(true);
  });

  it("fixes the day once the game is revealed", () => {
    expect(devFieldEnabled(state({ outcome: "revealed" }), "day")).toBe(false);
    expect(devFieldEnabled(state({ outcome: "found" }), "day")).toBe(true);
  });

  it("shows the welcome intro only to a new hire mid-game", () => {
    expect(devFieldEnabled(state({ outcome: "active" }), "introSeen")).toBe(true);
    expect(devFieldEnabled(state({ outcome: "found" }), "introSeen")).toBe(false);
  });

  it("always offers the role and the view", () => {
    expect(devFieldEnabled(state({ view: "teammate" }), "role")).toBe(true);
    expect(devFieldEnabled(state({ view: "teammate" }), "view")).toBe(true);
  });
});

describe("devOptionDisabled", () => {
  it("never lets the player read a clue that is not out yet", () => {
    const daySeven = state({ day: 7 });
    expect([0, 1, 2, 3, 4].map((read) => devOptionDisabled(daySeven, "cluesRead", read))).toEqual([
      false,
      false,
      false,
      true,
      true,
    ]);
    expect(devOptionDisabled(state({ outcome: "revealed", day: 1 }), "cluesRead", 4)).toBe(false);
  });

  it("never finds the welcomer with an empty album", () => {
    expect(devOptionDisabled(state({ outcome: "found" }), "album", "empty")).toBe(true);
    expect(devOptionDisabled(state({ outcome: "active" }), "album", "empty")).toBe(false);
  });
});

describe("normalizeDevState", () => {
  it("drops clues read back to the clues out on the new day", () => {
    expect(normalizeDevState(state({ day: 4, cluesRead: 3 })).cluesRead).toBe(1);
  });

  it("starts the album and marks the intro seen once the welcomer is found", () => {
    expect(
      normalizeDevState(state({ outcome: "found", album: "empty", introSeen: false })),
    ).toMatchObject({ album: "started", introSeen: true });
  });

  it("marks the intro seen once the game was revealed", () => {
    expect(normalizeDevState(state({ outcome: "revealed", introSeen: false })).introSeen).toBe(
      true,
    );
  });

  it("leaves a valid state as it is", () => {
    expect(normalizeDevState(DEV_STATE_DEFAULT)).toEqual(DEV_STATE_DEFAULT);
  });
});
