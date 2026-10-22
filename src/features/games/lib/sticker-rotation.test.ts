import { describe, expect, it } from "vitest";
import { dropRotation, restingRotation } from "./sticker-rotation";

describe("restingRotation", () => {
  it("repeats the hand-stuck angles down the album", () => {
    expect(restingRotation(0)).toBe(-2);
    expect(restingRotation(6)).toBe(restingRotation(0));
    expect(restingRotation(7)).toBe(restingRotation(1));
  });
});

describe("dropRotation", () => {
  it("is the same for the same sticker and stays within a few degrees", () => {
    for (let index = 0; index < 40; index += 1) {
      expect(dropRotation(index)).toBe(dropRotation(index));
      expect(Math.abs(dropRotation(index))).toBeLessThanOrEqual(1.5);
    }
  });

  it("varies between neighbours", () => {
    const angles = new Set(Array.from({ length: 10 }, (_, index) => dropRotation(index)));
    expect(angles.size).toBeGreaterThan(3);
  });
});
