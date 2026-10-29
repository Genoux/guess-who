import { describe, expect, it } from "vitest";
import {
  addDays,
  clueReleaseAt,
  daysLeft,
  gameDay,
  isClueNumber,
  isPastReveal,
  releaseAtForDay,
  revealAt,
  todayInGameZone,
  zonedTime,
} from "./game-schedule";

describe("addDays", () => {
  it("moves across months and years", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDays("2026-12-30", 2)).toBe("2027-01-01");
    expect(addDays("2026-11-02", -1)).toBe("2026-11-01");
  });
});

describe("zonedTime", () => {
  it("reads 09:00 in Montréal during daylight time", () => {
    expect(zonedTime("2026-10-21", 9).toISOString()).toBe("2026-10-21T13:00:00.000Z");
  });

  it("reads 09:00 in Montréal during standard time", () => {
    expect(zonedTime("2026-11-06", 9).toISOString()).toBe("2026-11-06T14:00:00.000Z");
  });

  it("handles the day the clocks change", () => {
    expect(zonedTime("2026-11-01", 9).toISOString()).toBe("2026-11-01T14:00:00.000Z");
    expect(zonedTime("2026-03-08", 9).toISOString()).toBe("2026-03-08T13:00:00.000Z");
  });
});

describe("release times", () => {
  const start = "2026-11-02";

  it("puts day 1 on the start date", () => {
    expect(releaseAtForDay(start, 1).toISOString()).toBe("2026-11-02T14:00:00.000Z");
  });

  it("releases the clues on days 3, 6, 9 and 12", () => {
    expect(clueReleaseAt(start, 1).toISOString()).toBe("2026-11-04T14:00:00.000Z");
    expect(clueReleaseAt(start, 2).toISOString()).toBe("2026-11-07T14:00:00.000Z");
    expect(clueReleaseAt(start, 3).toISOString()).toBe("2026-11-10T14:00:00.000Z");
    expect(clueReleaseAt(start, 4).toISOString()).toBe("2026-11-13T14:00:00.000Z");
  });

  it("reveals on day 14", () => {
    expect(revealAt(start).toISOString()).toBe("2026-11-15T14:00:00.000Z");
    expect(isPastReveal(start, new Date("2026-11-15T13:59:59Z"))).toBe(false);
    expect(isPastReveal(start, new Date("2026-11-15T14:00:00Z"))).toBe(true);
  });
});

describe("gameDay and daysLeft", () => {
  const start = "2026-11-02";

  it("counts the start date as day 1, in Montréal time", () => {
    expect(gameDay(start, new Date("2026-11-02T05:00:00Z"))).toBe(1);
    // 23:30 on Nov 2 in Montréal is already Nov 3 in UTC.
    expect(gameDay(start, new Date("2026-11-03T04:30:00Z"))).toBe(1);
    expect(gameDay(start, new Date("2026-11-07T15:00:00Z"))).toBe(6);
  });

  it("is zero or less before the start", () => {
    expect(gameDay(start, new Date("2026-11-01T15:00:00Z"))).toBe(0);
  });

  it("leaves 8 days on day 6 and never goes below 0", () => {
    expect(daysLeft(start, new Date("2026-11-07T15:00:00Z"))).toBe(8);
    expect(daysLeft(start, new Date("2026-12-01T15:00:00Z"))).toBe(0);
    expect(daysLeft(start, new Date("2026-10-01T15:00:00Z"))).toBe(14);
  });
});

describe("isClueNumber", () => {
  it("accepts 1 to 4 only", () => {
    expect([0, 1, 2, 3, 4, 5].map(isClueNumber)).toEqual([false, true, true, true, true, false]);
  });
});

describe("todayInGameZone", () => {
  it("reads the calendar date in Montréal, not UTC", () => {
    expect(todayInGameZone(new Date("2026-10-29T02:30:00Z"))).toBe("2026-10-28");
    expect(todayInGameZone(new Date("2026-10-29T12:30:00Z"))).toBe("2026-10-29");
  });
});
