import { createLogger } from "@inbeat/core/logger";
import type { Options } from "canvas-confetti";

const log = createLogger({ level: "debug", bindings: { module: "celebrate" } });

/** A point in viewport fractions: 0,0 is the top left, 1,1 the bottom right. */
export type CelebrateOrigin = { x: number; y: number };

export type CelebrateKind = "unlock" | "found" | "burst";

/** Which background the stars land on; each keeps them visible against it. */
export type CelebratePalette = "light" | "dark" | "found";

export type CelebrateOptions = {
  kind?: CelebrateKind;
  palette?: CelebratePalette;
};

// canvas-confetti draws on a canvas and only takes hex values, so these mirror game-theme.css.
const PALETTES: Record<CelebratePalette, string[]> = {
  light: ["#F9D317", "#EA4112", "#46BDF0", "#191910"],
  dark: ["#F9D317", "#FFFFFF", "#EA4112"],
  found: ["#F9D317", "#FFFFFF", "#191910"],
};

const PARTICLES: Record<CelebrateKind, number> = { unlock: 45, found: 80, burst: 60 };

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function buildCelebrateOptions(
  origin: CelebrateOrigin,
  { kind = "burst", palette = "light" }: CelebrateOptions = {},
): Options {
  return {
    particleCount: PARTICLES[kind],
    spread: kind === "burst" ? 80 : 75,
    startVelocity: kind === "burst" ? 32 : 30,
    ticks: 140,
    scalar: 1.1,
    shapes: ["star"],
    colors: PALETTES[palette],
    origin: { x: clamp(origin.x), y: clamp(origin.y) },
    disableForReducedMotion: true,
  };
}

/** The centre of a box as a viewport fraction, the origin canvas-confetti expects. */
export function originFromRect(
  rect: { left: number; top: number; width: number; height: number },
  viewport: { width: number; height: number },
): CelebrateOrigin {
  if (viewport.width <= 0 || viewport.height <= 0) return { x: 0.5, y: 0.5 };
  return {
    x: clamp((rect.left + rect.width / 2) / viewport.width),
    y: clamp((rect.top + rect.height / 2) / viewport.height),
  };
}

export function originFromElement(element: Element): CelebrateOrigin {
  return originFromRect(element.getBoundingClientRect(), {
    width: window.innerWidth,
    height: window.innerHeight,
  });
}

/**
 * Fires a star burst. Browser only; does nothing when the user prefers reduced motion. Never
 * rejects: the stars are decorative, so a failed chunk load (a stale deploy) is only logged.
 */
export async function celebrate(
  origin: CelebrateOrigin,
  options?: CelebrateOptions,
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const { default: confetti } = await import("canvas-confetti");
    await confetti(buildCelebrateOptions(origin, options));
  } catch (error) {
    log.debug("celebration skipped", {
      reason: error instanceof Error ? error.name : "unknown",
    });
  }
}
