import { describe, expect, it } from "vitest";
import { TRANSITION } from "./game-motion";
import {
  askContentVariants,
  askPanelVariants,
  factRowVariants,
  factTextVariants,
} from "./sticker-motion";

describe("factRowVariants", () => {
  it("opens a zero-height row to its content and takes the soft edge away", () => {
    const { shown, hidden } = factRowVariants(TRANSITION.enter, false);
    expect(hidden.gridTemplateRows).toBe("0fr");
    expect(shown.gridTemplateRows).toBe("1fr");
    expect(hidden["--fact-edge"]).toBe(1);
    expect(shown["--fact-edge"]).toBe(0);
  });

  it("moves both ways on the transition it is given", () => {
    const { shown, hidden } = factRowVariants(TRANSITION.land, false);
    expect(shown.transition).toBe(TRANSITION.land);
    expect(hidden.transition).toBe(TRANSITION.land);
  });

  it("jumps under reduced motion", () => {
    const { shown, hidden } = factRowVariants(TRANSITION.land, true);
    expect(shown.transition.duration).toBe(0);
    expect(hidden.transition.duration).toBe(0);
  });
});

describe("factTextVariants", () => {
  it("fades with the row, on the same transition", () => {
    const { shown, hidden } = factTextVariants(TRANSITION.land, false);
    expect(hidden.opacity).toBe(0);
    expect(shown.opacity).toBe(1);
    expect(shown.transition).toBe(TRANSITION.land);
  });

  it("jumps under reduced motion", () => {
    expect(factTextVariants(TRANSITION.land, true).hidden.transition.duration).toBe(0);
  });
});

describe("askPanelVariants", () => {
  it("grows from the corner and hides once shrunk", () => {
    const { open, closed } = askPanelVariants(false);
    expect(open["--ask-progress"]).toBe(1);
    expect(closed["--ask-progress"]).toBe(0);
    expect(open.opacity).toBe(closed.opacity);
    expect(open.visibility).toBe("visible");
    expect(closed.visibility).toBe("hidden");
  });

  it("fades in place under reduced motion", () => {
    const { open, closed } = askPanelVariants(true);
    expect(open["--ask-progress"]).toBe(closed["--ask-progress"]);
    expect(open.opacity).toBe(1);
    expect(closed.opacity).toBe(0);
  });
});

describe("askContentVariants", () => {
  it("rises in and drops out, and stays put under reduced motion", () => {
    const moving = askContentVariants(false);
    expect(moving.closed.y).toBeGreaterThan(0);
    expect(moving.closed.opacity).toBe(0);
    const still = askContentVariants(true);
    expect(still.closed).toEqual(still.open);
  });
});
