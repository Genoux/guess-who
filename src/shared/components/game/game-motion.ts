import type { Transition } from "motion/react";

/** Seconds. game-theme.css mirrors them as `--transition-duration-*` for the `duration-*` classes. */
export const DURATION = { instant: 0.12, fast: 0.2, base: 0.32, slow: 0.5, slower: 0.64 } as const;

export const EASE = {
  /** Arriving: quick off the mark, a long soft settle. `--ease-game` mirrors it. */
  game: [0.2, 0.8, 0.2, 1],
  /** Leaving: starts slow and speeds away, the mirror of `game`. */
  exit: [0.6, 0, 0.8, 0.2],
  /** Cards dealt onto the table: no overshoot, so a row lands still. */
  deal: [0.2, 0, 0, 1],
  /** A slow, settling turn. */
  flip: [0.3, 0.7, 0.2, 1],
  /** A card set down from above: a small overshoot. */
  land: [0.2, 0.9, 0.3, 1.2],
  /** Stamps hitting a card: a quick, hard overshoot. */
  stamp: [0.2, 0.9, 0.3, 1.4],
} as const;

const BEAT_S = 0.12;
const STAGGER_S = 0.04;
/** The most a list may spread over, so a long one does not crawl. */
const STAGGER_BUDGET_S = 0.3;

/** Pauses between sections of a screen arriving one after another. */
export const beats = (count: number) => count * BEAT_S;

export const stagger = (index: number, count: number) =>
  index * Math.min(STAGGER_S, STAGGER_BUDGET_S / Math.max(count, 1));

export const TRANSITION = {
  enter: { duration: DURATION.base, ease: EASE.game },
  arrive: { duration: DURATION.slow, ease: EASE.game },
  travel: { duration: DURATION.slower, ease: EASE.game },
  exit: { duration: DURATION.base, ease: EASE.exit },
  exitFast: { duration: DURATION.fast, ease: EASE.exit },
  fade: { duration: DURATION.fast },
  clear: { duration: DURATION.instant },
  // Off the scale on purpose: the album's deal was tuned by hand at 0.24s.
  deal: { duration: 0.24, ease: EASE.deal },
  land: { duration: DURATION.slower, ease: EASE.land },
  flip: { duration: DURATION.slower, ease: EASE.flip },
  stamp: { duration: DURATION.fast, ease: EASE.stamp },
  shake: { duration: DURATION.base, delay: BEAT_S },
  pulse: { duration: 1.6, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY },
} satisfies Record<string, Transition>;

export const SHAKE_X = [0, -8, 8, -5, 5, 0];
