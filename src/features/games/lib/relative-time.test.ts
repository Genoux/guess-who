import { describe, expect, it } from "vitest";
import { describeActivity } from "./relative-time";

const now = new Date("2026-10-28T15:00:00Z");
const ago = (ms: number) => new Date(now.getTime() - ms);
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("describeActivity", () => {
  it("says there is none yet", () => {
    expect(describeActivity(null, now)).toBe("No activity yet");
  });

  it.each([
    [0, "Active just now"],
    [59 * SECOND, "Active just now"],
    [60 * SECOND, "Active 1 minute ago"],
    [3 * MINUTE + 20 * SECOND, "Active 3 minutes ago"],
    [59 * MINUTE + 59 * SECOND, "Active 59 minutes ago"],
    [HOUR, "Active 1 hour ago"],
    [3 * HOUR + 40 * MINUTE, "Active 3 hours ago"],
    [23 * HOUR + 59 * MINUTE, "Active 23 hours ago"],
    [DAY, "Active yesterday"],
    [47 * HOUR, "Active yesterday"],
    [2 * DAY, "Active 2 days ago"],
    [6 * DAY + 23 * HOUR, "Active 6 days ago"],
    [7 * DAY, "Active last week"],
    [13 * DAY, "Active last week"],
    [14 * DAY, "Active 2 weeks ago"],
    [30 * DAY, "Active 4 weeks ago"],
  ])("reads %i ms ago as %s", (elapsed, text) => {
    expect(describeActivity(ago(elapsed), now)).toBe(text);
  });

  it("treats a moment slightly ahead of the clock as just now", () => {
    expect(describeActivity(new Date(now.getTime() + 5 * SECOND), now)).toBe("Active just now");
  });
});
