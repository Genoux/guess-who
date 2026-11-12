import { describe, expect, it } from "vitest";
import { getClueTextStep } from "./clue-card";

describe("getClueTextStep", () => {
  it("keeps a clue big up to 70 characters", () => {
    expect(getClueTextStep("x".repeat(70))).toBe("large");
  });

  it("steps a longer clue down so it stays inside the small card", () => {
    expect(getClueTextStep("x".repeat(71))).toBe("medium");
    expect(getClueTextStep("x".repeat(95))).toBe("medium");
    expect(getClueTextStep("x".repeat(96))).toBe("small");
    expect(getClueTextStep("x".repeat(160))).toBe("small");
  });

  it("measures the text as written, not the padding around it", () => {
    expect(getClueTextStep(`  ${"x".repeat(70)}  `)).toBe("large");
  });
});
