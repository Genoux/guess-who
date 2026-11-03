import { describe, expect, it } from "vitest";
import { missionOutcome, missionStateAt, summarizeProgress } from "./mission-progress";

// Wednesday 2026-10-28, 11:00 in Montréal.
const now = new Date("2026-10-28T15:00:00Z");
const playing = {
  status: "active" as const,
  startDate: "2026-10-26",
  foundAt: null,
};

describe("missionStateAt", () => {
  it("is none without a game", () => {
    expect(missionStateAt(null, now)).toBe("none");
  });

  it("is playing for an active game", () => {
    expect(missionStateAt(playing, now)).toBe("playing");
  });

  it.each(["found", "revealed"] as const)("is over for a %s game", (status) => {
    expect(missionStateAt({ ...playing, status }, now)).toBe("over");
  });

  it("is over for an active game past day 14, before the first read marks it revealed", () => {
    expect(missionStateAt({ ...playing, startDate: "2026-10-01" }, now)).toBe("over");
  });
});

describe("missionOutcome", () => {
  it("says on which day a mission was found, and when", () => {
    const foundAt = new Date("2026-10-05T16:00:00Z");
    expect(
      missionOutcome({ ...playing, status: "found", startDate: "2026-09-28", foundAt }),
    ).toEqual({ label: "Found on day 8", found: true, endedAt: foundAt });
  });

  it("reveals on day 14 at 09:00 Montréal, also for an active game that ran out", () => {
    const outcome = {
      label: "Revealed on day 14",
      found: false,
      endedAt: new Date("2026-10-18T13:00:00Z"),
    };
    expect(missionOutcome({ ...playing, status: "revealed", startDate: "2026-10-05" })).toEqual(
      outcome,
    );
    expect(missionOutcome({ ...playing, startDate: "2026-10-05" })).toEqual(outcome);
  });
});

describe("summarizeProgress", () => {
  const progress = (overrides = {}) =>
    summarizeProgress({
      collected: 12,
      lastActiveAt: new Date("2026-10-28T14:00:00Z"),
      now,
      ...overrides,
    });

  it("counts the stickers, singular for one", () => {
    expect(progress().label).toBe("12");
    expect(progress({ collected: 1 }).label).toBe("1");
    expect(progress({ collected: 0 }).label).toBe("0");
  });

  it("says when the player was last active", () => {
    expect(progress().activity).toBe("1h ago");
    expect(progress({ lastActiveAt: null }).activity).toBe("Not yet");
  });
});
