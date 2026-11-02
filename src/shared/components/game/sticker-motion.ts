import type { Transition } from "motion/react";
import { NUDGE_PX, TRANSITION } from "./game-motion";

// The panel's size is all CSS (`ask-geometry` and `ask-panel-clip` in game-theme.css): motion only
// moves `--ask-progress` from 0 (a circle on the button) to 1 (the whole panel).
const GROW = TRANSITION.arrive;
const TEXT_OUT = TRANSITION.clear;
// The text comes in once the grow is this far along.
const TEXT_IN_AT = 0.45;
// Closing: the text goes out first, then the panel shrinks back into the corner.
const SHRINK = { ...TRANSITION.enter, delay: TEXT_OUT.duration };
const TEXT_IN = { ...TRANSITION.fade, delay: GROW.duration * TEXT_IN_AT };

/** Reduced motion swaps the grow for a plain fade of the whole panel. */
export const askPanelVariants = (reducedMotion: boolean) => {
  const closing = reducedMotion ? { ...TRANSITION.fade, delay: 0 } : SHRINK;
  return {
    open: {
      "--ask-progress": 1,
      opacity: 1,
      visibility: "visible",
      transition: reducedMotion ? TRANSITION.fade : GROW,
    },
    closed: {
      "--ask-progress": reducedMotion ? 1 : 0,
      opacity: reducedMotion ? 0 : 1,
      visibility: "hidden",
      transition: {
        ...closing,
        visibility: { delay: closing.delay + closing.duration, duration: 0 },
      },
    },
  } as const;
};

export const askContentVariants = (reducedMotion: boolean) =>
  ({
    open: {
      opacity: 1,
      y: 0,
      transition: reducedMotion ? TRANSITION.clear : TEXT_IN,
    },
    closed: {
      opacity: reducedMotion ? 1 : 0,
      y: reducedMotion ? 0 : NUDGE_PX,
      transition: TEXT_OUT,
    },
  }) as const;

const INSTANT = { duration: 0 } as const;

/** The + button's fade, quick enough to be gone at the start of a close. */
export const askToggleFade = (reducedMotion: boolean) =>
  reducedMotion ? INSTANT : TRANSITION.fade;

/**
 * The fact's row under the photo: zero height to its content's own, with `--fact-edge` (1 down
 * to 0) easing away the soft bottom edge the growing row would otherwise clip with. The caller
 * picks the transition, so the reveal runs on whatever motion carries the card.
 */
export const factRowVariants = (transition: Transition, reducedMotion: boolean) => {
  const move = reducedMotion ? INSTANT : transition;
  return {
    shown: { gridTemplateRows: "1fr", "--fact-edge": 0, transition: move },
    hidden: { gridTemplateRows: "0fr", "--fact-edge": 1, transition: move },
  } as const;
};

export const factTextVariants = (transition: Transition, reducedMotion: boolean) => {
  const move = reducedMotion ? INSTANT : transition;
  return {
    shown: { opacity: 1, transition: move },
    hidden: { opacity: 0, transition: move },
  } as const;
};
