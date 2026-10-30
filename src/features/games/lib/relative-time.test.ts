import { describe, expect, it } from "vitest";
import { describeActivity, describeTurnedOn } from "./relative-time";

const now = new Date("2026-10-28T15:00:00Z");
const ago = (ms: number) => new Date(now.getTime() - ms);
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("describeActivity", () => {
  it("says there is none yet", () => {
    expect(describeActivity(null, now)).toBe("Not yet");
  });

  it.each([
    [0, "just now"],
    [59 * SECOND, "just now"],
    [60 * SECOND, "1m ago"],
    [3 * MINUTE + 20 * SECOND, "3m ago"],
    [59 * MINUTE + 59 * SECOND, "59m ago"],
    [HOUR, "1h ago"],
    [3 * HOUR + 40 * MINUTE, "3h ago"],
    [23 * HOUR + 59 * MINUTE, "23h ago"],
    [DAY, "1d ago"],
    [47 * HOUR, "1d ago"],
    [2 * DAY, "2d ago"],
    [6 * DAY + 23 * HOUR, "6d ago"],
    [7 * DAY, "1w ago"],
    [13 * DAY, "1w ago"],
    [14 * DAY, "2w ago"],
    [30 * DAY, "4w ago"],
  ])("reads %i ms ago as %s", (elapsed, text) => {
    expect(describeActivity(ago(elapsed), now)).toBe(text);
  });

  it("treats a moment slightly ahead of the clock as just now", () => {
    expect(describeActivity(new Date(now.getTime() + 5 * SECOND), now)).toBe("just now");
  });
});

describe("describeTurnedOn", () => {
  it.each([
    [0, "today"],
    [23 * HOUR, "today"],
    [DAY, "1d ago"],
    [47 * HOUR, "1d ago"],
    [3 * DAY, "3d ago"],
    [20 * DAY, "2w ago"],
  ])("says %s ms ago as %s", (elapsed, text) => {
    expect(describeTurnedOn(ago(elapsed), now)).toBe(text);
  });
});
