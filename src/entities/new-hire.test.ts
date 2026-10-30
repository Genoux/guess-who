import { describe, expect, it } from "vitest";
import { isLockedNewHire } from "./new-hire";

describe("isLockedNewHire", () => {
  it("locks My card and My clues for a new hire, until their mission is done", () => {
    expect(isLockedNewHire({ newHire: true })).toBe(true);
  });

  it("never locks anyone else, whatever their card or mission looks like", () => {
    expect(isLockedNewHire({ newHire: false })).toBe(false);
  });
});
