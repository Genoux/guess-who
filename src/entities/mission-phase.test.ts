import { describe, expect, it } from "vitest";
import { missionPhase } from "./mission-phase";

const now = new Date("2026-10-28T15:00:00Z");
const playing = { status: "active", startDate: "2026-10-26" };

describe("missionPhase", () => {
  it("is none without a game", () => {
    expect(missionPhase(null)).toBe("none");
    expect(missionPhase(undefined, now)).toBe("none");
  });

  it("is playing for an active game", () => {
    expect(missionPhase(playing, now)).toBe("playing");
  });

  it.each(["found", "revealed"])("is over for a %s game", (status) => {
    expect(missionPhase({ ...playing, status }, now)).toBe("over");
  });

  it("is over for an active game past day 14 once the time is given", () => {
    const ran = { ...playing, startDate: "2026-10-01" };
    expect(missionPhase(ran, now)).toBe("over");
    expect(missionPhase(ran)).toBe("playing");
  });
});
