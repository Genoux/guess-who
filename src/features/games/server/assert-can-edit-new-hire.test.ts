import { isAppError } from "@inbeat/core/errors";
import { describe, expect, it } from "vitest";
import { assertCanEditNewHire } from "./assert-can-edit-new-hire";

const now = new Date("2026-10-28T15:00:00Z");
const game = { status: "active" as const, startDate: "2026-10-26", playerPersonId: null };

describe("assertCanEditNewHire", () => {
  it("allows an unlinked game, started or not", () => {
    expect(() => assertCanEditNewHire(game, now)).not.toThrow();
    expect(() => assertCanEditNewHire({ ...game, startDate: "2026-11-02" }, now)).not.toThrow();
  });

  it("allows a linked game before it starts", () => {
    expect(() =>
      assertCanEditNewHire({ ...game, startDate: "2026-11-02", playerPersonId: "player" }, now),
    ).not.toThrow();
  });

  it.each([
    ["linked to a player and started", { playerPersonId: "player" }],
    ["found", { status: "found" as const }],
    ["revealed", { status: "revealed" as const }],
    ["past day 14", { startDate: "2026-10-01" }],
  ])("forbids a game %s", (_name, overrides) => {
    expect(() => assertCanEditNewHire({ ...game, ...overrides }, now)).toThrow(
      expect.toSatisfy((err) => isAppError(err, "forbidden")),
    );
  });
});
