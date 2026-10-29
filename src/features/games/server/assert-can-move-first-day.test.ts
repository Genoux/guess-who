import { isAppError } from "@inbeat/core/errors";
import { describe, expect, it } from "vitest";
import { assertCanMoveFirstDay } from "./assert-can-move-first-day";

const now = new Date("2026-10-28T15:00:00Z");
const failsWith = (kind: "validation") => expect.toSatisfy((err) => isAppError(err, kind));

describe("assertCanMoveFirstDay", () => {
  it("allows a game that has not started", () => {
    expect(() => assertCanMoveFirstDay("2026-10-29", "2026-11-09", now)).not.toThrow();
  });

  it("allows moving it to today", () => {
    expect(() => assertCanMoveFirstDay("2026-10-29", "2026-10-28", now)).not.toThrow();
  });

  it("refuses once the game has started", () => {
    expect(() => assertCanMoveFirstDay("2026-10-28", "2026-11-09", now)).toThrow(
      failsWith("validation"),
    );
  });

  it("refuses a day before today", () => {
    expect(() => assertCanMoveFirstDay("2026-10-29", "2026-10-27", now)).toThrow(
      failsWith("validation"),
    );
  });
});
