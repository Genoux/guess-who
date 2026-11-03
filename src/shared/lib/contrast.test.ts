import { describe, expect, it } from "vitest";
import { contrastRatio, readableOn, relativeLuminance } from "./contrast";

describe("relativeLuminance", () => {
  it("reads short and long hex", () => {
    expect(relativeLuminance("#fff")).toBeCloseTo(1);
    expect(relativeLuminance("000000")).toBe(0);
  });

  it("returns null for anything else", () => {
    expect(relativeLuminance("rebeccapurple")).toBeNull();
    expect(relativeLuminance("#12345")).toBeNull();
  });
});

describe("contrastRatio", () => {
  it("is 21 for black on white, in either order", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21);
    expect(contrastRatio("#fff", "#000")).toBeCloseTo(21);
  });

  it("keeps the muted text readable on the game background", () => {
    expect(contrastRatio("#5C5C55", "#F7F7F3")).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the game error color readable on the surface and the background", () => {
    expect(contrastRatio("#B8320C", "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#B8320C", "#F7F7F3")).toBeGreaterThanOrEqual(4.5);
  });
});

describe("readableOn", () => {
  it("puts ink on light team colors", () => {
    expect(readableOn("#46BDF0")).toBe("ink");
    expect(readableOn("#FF97AB")).toBe("ink");
    expect(readableOn("#F9D317")).toBe("ink");
  });

  it("puts white on dark team colors", () => {
    expect(readableOn("#157428")).toBe("white");
    expect(readableOn("#2B3592")).toBe("white");
  });

  it("falls back to ink for colors it cannot read", () => {
    expect(readableOn("var(--x)")).toBe("ink");
  });
});
