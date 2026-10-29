import { isAppError } from "@inbeat/core/errors";
import { describe, expect, it } from "vitest";
import { assertFirstDayNotPast } from "./assert-first-day-not-past";

describe("assertFirstDayNotPast", () => {
  it("counts today by the Montréal date", () => {
    const lateEvening = new Date("2026-10-29T02:30:00Z");
    expect(() => assertFirstDayNotPast("2026-10-28", lateEvening)).not.toThrow();
    expect(() => assertFirstDayNotPast("2026-10-27", lateEvening)).toThrow(
      expect.toSatisfy((err) => isAppError(err, "validation")),
    );
  });

  it("allows a later day", () => {
    expect(() =>
      assertFirstDayNotPast("2026-12-01", new Date("2026-10-28T15:00:00Z")),
    ).not.toThrow();
  });
});
