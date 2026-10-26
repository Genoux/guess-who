import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DURATION, EASE, stagger } from "./game-motion";

const SRC = fileURLToPath(new URL("../../../", import.meta.url));

const MOTION_IMPORT = /from\s+["']motion\/react[^"']*["']/;
const TIMING_KEY = /\b(?:duration|ease)\s*:/g;
const DELAY = /\b\w*[dD]elay(?:\s*:\s*([^,}\n]+)|=\{([^}\n]+)\})/g;
const NUMBER = /(?<![\w.])\d*\.?\d+(?![\w.])/g;
const TIMING_CLASS = /\b(?:duration-(?:\d|\[)|delay-(?:\d|\[))/g;

const hasNonZeroNumber = (expression: string) =>
  [...expression.matchAll(NUMBER)].some(([literal]) => Number(literal) !== 0);

/** Timing written in place instead of taken from game-motion.ts or a feature's `*-motion.ts`. */
function inlineTiming(source: string): string[] {
  const keys = MOTION_IMPORT.test(source) ? [...source.matchAll(TIMING_KEY)] : [];
  const delays = [...source.matchAll(DELAY)].filter(([, key, prop]) =>
    hasNonZeroNumber(key ?? prop ?? ""),
  );
  const classes = [...source.matchAll(TIMING_CLASS)];
  return [...keys, ...delays, ...classes].map(([match]) => match.trim());
}

const sources = readdirSync(SRC, { recursive: true, encoding: "utf8" })
  .filter((path) => /\.tsx?$/.test(path) && !/(-motion|\.test)\.tsx?$/.test(path))
  .map((path) => ({ path, text: readFileSync(`${SRC}${path}`, "utf8") }));

describe("inlineTiming", () => {
  it.each([
    [
      "a duration key",
      `import { motion } from "motion/react";\nconst t = { duration: DURATION.fast };`,
    ],
    ["an ease key", `import { m } from 'motion/react-m';\nconst t = { ease: EASE.game };`],
    ["a numeric delay prop", "<Reveal delay={i * 0.08} />"],
    ["a numeric flip delay prop", "<Sticker flipDelay={beats(3)} />"],
    ["a numeric delay key", "export const Delayed = { args: { delay: 1 } };"],
    ["a numeric duration class", `<div className="transition duration-200" />`],
    ["a numeric delay class", `<div className="transition delay-150" />`],
    ["an arbitrary duration class", `<div className="duration-[250ms]" />`],
    ["an arbitrary delay class", `<div className="delay-[1s]" />`],
  ])("catches %s", (_shape, source) => {
    expect(inlineTiming(source)).not.toEqual([]);
  });

  it.each([
    [
      "a named transition with a computed delay",
      `import { motion } from "motion/react";\nconst t = { ...TRANSITION.deal, delay: stagger(i, n) };`,
    ],
    ["a zero delay", "const t = { delay: direction < 0 ? AFTER_LEAVE_S : 0 };"],
    ["a toast duration outside motion code", "toast(message, { duration: 6000 });"],
    ["a tooltip delay", "<Tooltip.Provider delayDuration={300} />"],
  ])("allows %s", (_shape, source) => {
    expect(inlineTiming(source)).toEqual([]);
  });
});

describe("motion timing lives in *-motion.ts", () => {
  it("has no inline timing in src", () => {
    const offenders = sources.flatMap(({ path, text }) =>
      inlineTiming(text).map((match) => `${path}: ${match}`),
    );
    expect(offenders).toEqual([]);
  });
});

describe("game-theme.css mirrors the motion tokens", () => {
  const css = readFileSync(`${SRC}shared/components/game/game-theme.css`, "utf8");
  const cssVar = (name: string) => css.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim();

  it("has the game ease", () => {
    expect(cssVar("ease-game")).toBe(`cubic-bezier(${EASE.game.join(", ")})`);
  });

  it.each(Object.entries(DURATION))("has the %s duration", (name, seconds) => {
    expect(cssVar(`transition-duration-${name}`)).toBe(`${Math.round(seconds * 1000)}ms`);
  });
});

describe("stagger", () => {
  it("steps list items by the stagger", () => {
    expect(stagger(2, 3)).toBeCloseTo(0.08);
  });

  it("squeezes a long list into the budget", () => {
    expect(stagger(99, 100)).toBeLessThanOrEqual(0.3);
  });
});
