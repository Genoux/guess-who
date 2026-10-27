import { describe, expect, it } from "vitest";
import { endingEyebrow } from "./ending-eyebrow";

describe("endingEyebrow", () => {
  it("calls a find a completed mission, seen or not", () => {
    expect(endingEyebrow({ found: true, revealSeen: false })).toBe("Mission complete");
    expect(endingEyebrow({ found: true, revealSeen: true })).toBe("Mission complete");
  });

  it("says time is up until the reveal has been seen", () => {
    expect(endingEyebrow({ found: false, revealSeen: false })).toBe("Day 14 · Time’s up");
  });

  it("settles on the day once the reveal has been seen", () => {
    expect(endingEyebrow({ found: false, revealSeen: true })).toBe("Day 14");
  });
});
