import { describe, expect, it } from "vitest";
import { buildCelebrateOptions, originFromRect } from "./celebrate";

describe("buildCelebrateOptions", () => {
  it("always uses stars and respects reduced motion", () => {
    const options = buildCelebrateOptions({ x: 0.5, y: 0.5 });
    expect(options.shapes).toEqual(["star"]);
    expect(options.disableForReducedMotion).toBe(true);
  });

  it("defaults to a burst on the light palette", () => {
    const options = buildCelebrateOptions({ x: 0.2, y: 0.7 });
    expect(options.particleCount).toBe(60);
    expect(options.colors).toEqual(["#F9D317", "#EA4112", "#46BDF0", "#191910"]);
    expect(options.origin).toEqual({ x: 0.2, y: 0.7 });
  });

  it("throws more stars for found than for an unlock", () => {
    const found = buildCelebrateOptions({ x: 0.5, y: 0.5 }, { kind: "found" });
    const unlock = buildCelebrateOptions({ x: 0.5, y: 0.5 }, { kind: "unlock" });
    expect(found.particleCount).toBeGreaterThan(unlock.particleCount ?? 0);
  });

  it("switches colors for dark and found backgrounds", () => {
    expect(buildCelebrateOptions({ x: 0, y: 0 }, { palette: "dark" }).colors).toContain("#FFFFFF");
    expect(buildCelebrateOptions({ x: 0, y: 0 }, { palette: "found" }).colors).not.toContain(
      "#EA4112",
    );
  });

  it("clamps the origin into the viewport", () => {
    expect(buildCelebrateOptions({ x: -1, y: 4 }).origin).toEqual({ x: 0, y: 1 });
  });
});

describe("originFromRect", () => {
  it("returns the centre of the box as viewport fractions", () => {
    const origin = originFromRect(
      { left: 100, top: 200, width: 200, height: 100 },
      { width: 1000, height: 1000 },
    );
    expect(origin).toEqual({ x: 0.2, y: 0.25 });
  });

  it("falls back to the centre for an empty viewport", () => {
    expect(
      originFromRect({ left: 0, top: 0, width: 10, height: 10 }, { width: 0, height: 0 }),
    ).toEqual({
      x: 0.5,
      y: 0.5,
    });
  });
});
