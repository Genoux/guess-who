import { isAppError } from "@inbeat/core/errors";
import { describe, expect, it } from "vitest";
import { assertCanRemoveNewHire } from "./assert-can-remove-new-hire";

const now = new Date("2026-10-28T15:00:00Z");
const game = { status: "active" as const, startDate: "2026-11-02", playerPersonId: null };
const forbidden = expect.toSatisfy((err) => isAppError(err, "forbidden"));

describe("assertCanRemoveNewHire", () => {
  it("allows an unlinked game that has not started", () => {
    expect(() => assertCanRemoveNewHire(game, now)).not.toThrow();
  });

  it("refuses a game that has started", () => {
    expect(() => assertCanRemoveNewHire({ ...game, startDate: "2026-10-28" }, now)).toThrow(
      forbidden,
    );
  });

  it("allows a game the player has already signed in to, before it starts", () => {
    expect(() => assertCanRemoveNewHire({ ...game, playerPersonId: "player" }, now)).not.toThrow();
  });

  it("refuses a linked game that has started", () => {
    expect(() =>
      assertCanRemoveNewHire({ ...game, startDate: "2026-10-28", playerPersonId: "player" }, now),
    ).toThrow(forbidden);
  });
});
