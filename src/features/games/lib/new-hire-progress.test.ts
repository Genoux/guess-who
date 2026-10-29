import { describe, expect, it } from "vitest";
import {
  canEditEmail,
  canEditNewHire,
  daysWithoutActivity,
  gamePhase,
  hasStarted,
  missingSignIn,
  newHireStatus,
  nextMonday,
  pickAnotherWelcomer,
  summarizeProgress,
} from "./new-hire-progress";

// Wednesday 2026-10-28, 11:00 in Montréal.
const now = new Date("2026-10-28T15:00:00Z");
const active = { status: "active" as const, startDate: "2026-10-26" };

describe("gamePhase", () => {
  it.each([
    ["2026-10-26", "playing"],
    ["2026-10-28", "playing"],
    ["2026-10-29", "upcoming"],
    ["2026-11-09", "upcoming"],
  ])("puts an active game starting %s in %s", (startDate, phase) => {
    expect(gamePhase({ status: "active", startDate }, now)).toBe(phase);
  });

  it.each(["found", "revealed"] as const)("puts a %s game in done", (status) => {
    expect(gamePhase({ status, startDate: "2026-10-26" }, now)).toBe("done");
  });

  it("puts an active game past day 14 in done", () => {
    expect(gamePhase({ status: "active", startDate: "2026-10-01" }, now)).toBe("done");
  });
});

describe("hasStarted", () => {
  it.each([
    ["2026-10-28", true],
    ["2026-10-20", true],
    ["2026-10-29", false],
  ])("is %s -> %s", (startDate, started) => {
    expect(hasStarted(startDate, now)).toBe(started);
  });
});

describe("canEditNewHire", () => {
  it("allows an unlinked game that is not done, started or not", () => {
    expect(canEditNewHire({ ...active, playerPersonId: null }, now)).toBe(true);
    expect(
      canEditNewHire({ status: "active", startDate: "2026-11-02", playerPersonId: null }, now),
    ).toBe(true);
  });

  it("allows a linked game until it starts", () => {
    expect(
      canEditNewHire({ status: "active", startDate: "2026-11-02", playerPersonId: "player" }, now),
    ).toBe(true);
  });

  it("refuses a linked game once it has started", () => {
    expect(canEditNewHire({ ...active, playerPersonId: "player" }, now)).toBe(false);
  });

  it("refuses a game that is done", () => {
    expect(canEditNewHire({ ...active, status: "found", playerPersonId: null }, now)).toBe(false);
    expect(
      canEditNewHire({ status: "found", startDate: "2026-11-02", playerPersonId: "player" }, now),
    ).toBe(false);
  });
});

describe("canEditEmail", () => {
  it("is open until the new hire signs in", () => {
    expect(canEditEmail({ playerPersonId: null })).toBe(true);
    expect(canEditEmail({ playerPersonId: "player" })).toBe(false);
  });
});

describe("missingSignIn", () => {
  it("flags an unlinked player from day 2", () => {
    expect(missingSignIn({ ...active, startDate: "2026-10-27", playerPersonId: null }, now)).toBe(
      true,
    );
  });

  it("waits through day 1", () => {
    expect(missingSignIn({ ...active, startDate: "2026-10-28", playerPersonId: null }, now)).toBe(
      false,
    );
  });

  it("does not flag a linked player, an upcoming game or a done one", () => {
    expect(missingSignIn({ ...active, playerPersonId: "player" }, now)).toBe(false);
    expect(missingSignIn({ ...active, startDate: "2026-11-02", playerPersonId: null }, now)).toBe(
      false,
    );
    expect(missingSignIn({ ...active, status: "revealed", playerPersonId: null }, now)).toBe(false);
  });
});

describe("newHireStatus", () => {
  it("counts the day of a game in play", () => {
    expect(newHireStatus({ ...active, foundAt: null }, now)).toEqual({
      label: "Day 3 of 14",
      tone: "dark",
    });
  });

  it("names the first day of an upcoming game", () => {
    expect(newHireStatus({ ...active, startDate: "2026-11-02", foundAt: null }, now)).toEqual({
      label: "Starts Mon, Nov 2",
      tone: "default",
    });
  });

  it("says on which day a game was found", () => {
    const foundAt = new Date("2026-10-05T16:00:00Z");
    expect(newHireStatus({ status: "found", startDate: "2026-09-28", foundAt }, now)).toEqual({
      label: "Found on day 8",
      tone: "found",
    });
  });

  it("reveals on day 14, also for an active game that ran out", () => {
    const revealed = { label: "Revealed on day 14", tone: "soft" };
    expect(
      newHireStatus({ status: "revealed", startDate: "2026-10-05", foundAt: null }, now),
    ).toEqual(revealed);
    expect(
      newHireStatus({ status: "active", startDate: "2026-10-01", foundAt: null }, now),
    ).toEqual(revealed);
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
    expect(progress().label).toBe("12 stickers");
    expect(progress({ collected: 1 }).label).toBe("1 sticker");
    expect(progress({ collected: 0 }).label).toBe("0 stickers");
  });

  it("says when the player was last active", () => {
    expect(progress().activity).toBe("Active 1 hour ago");
    expect(progress({ lastActiveAt: null }).activity).toBe("No activity yet");
  });
});

describe("daysWithoutActivity", () => {
  const idle = (
    game: Partial<
      Omit<typeof active, "status"> & { status: "active" | "found"; playerPersonId: string | null }
    >,
    lastActiveAt: Date | null = null,
  ) => daysWithoutActivity({ ...active, playerPersonId: "player", ...game }, lastActiveAt, now);

  it("counts from the last activity", () => {
    expect(idle({}, new Date("2026-10-25T15:00:00Z"))).toBe(3);
    expect(idle({}, new Date("2026-10-26T15:00:00Z"))).toBeNull();
  });

  it("counts from the first day when the player did nothing", () => {
    expect(idle({ startDate: "2026-10-25" })).toBe(3);
    expect(idle({ startDate: "2026-10-26" })).toBeNull();
  });

  it("does not flag a player who has not signed in, an upcoming game or a done one", () => {
    expect(idle({ startDate: "2026-10-20", playerPersonId: null })).toBeNull();
    expect(idle({ startDate: "2026-11-02" })).toBeNull();
    expect(idle({ startDate: "2026-10-20", status: "found" })).toBeNull();
  });
});

describe("nextMonday", () => {
  it.each([
    ["2026-10-28", "2026-11-02"],
    ["2026-10-26", "2026-11-02"],
    ["2026-11-01", "2026-11-02"],
    ["2026-10-31", "2026-11-02"],
  ])("after %s comes %s", (date, monday) => {
    expect(nextMonday(date)).toBe(monday);
  });
});

describe("pickAnotherWelcomer", () => {
  const options = [{ id: "ana" }, { id: "ben" }, { id: "cleo" }];

  it("never picks the selected teammate", () => {
    expect(pickAnotherWelcomer(options, "ana", () => 0)?.id).toBe("ben");
    expect(pickAnotherWelcomer(options, "ana", () => 0.999)?.id).toBe("cleo");
    expect(pickAnotherWelcomer(options, "ben", () => 0)?.id).toBe("ana");
  });

  it("has nobody to offer when the selected one is the only option", () => {
    expect(pickAnotherWelcomer([{ id: "ana" }], "ana", () => 0)).toBeUndefined();
  });
});
