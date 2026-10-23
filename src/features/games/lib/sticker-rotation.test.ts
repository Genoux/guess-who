import { describe, expect, it } from "vitest";
import { restingRotation } from "./sticker-rotation";

describe("restingRotation", () => {
  it("repeats the hand-stuck angles down the album", () => {
    expect(restingRotation(0)).toBe(-2);
    expect(restingRotation(6)).toBe(restingRotation(0));
    expect(restingRotation(7)).toBe(restingRotation(1));
  });
});
