import { DURATION, EASE, TRANSITION } from "@/shared/components/game/game-motion";

// Opening: the card flies (FLIGHT_S) while the backdrop and its text fade in together.
// Closing: the card flies back at once while they fade out.
const BACKDROP_FADE_S = 0.2;
export const FLIGHT_S = 0.36;

// On opening, the card leaves its slot first with the album still in view, so the gap it leaves
// shows; the backdrop follows once it is about a third of the way out.
export const BACKDROP_IN = { delay: 0.1, duration: BACKDROP_FADE_S };
export const BACKDROP_OUT = { duration: BACKDROP_FADE_S };
export const CONTENT_OUT = { duration: 0.15 };
export const CUT = { duration: 0 };

// A short lift-off, then most of the travel early, then a long soft landing: it moves within a
// couple of frames of the click (an ease-in-out quart sat still for ~150ms and read as lag), yet
// still accelerates, where an ease-out or a spring starts at full speed and reads as flat.
export const FLIGHT = { duration: FLIGHT_S, ease: [0.45, 0, 0.1, 1] } as const;

// The Reveal tap: the words fade, the face-down card slides to the middle of the screen and turns,
// holds there under the confetti, then slides back up to its place and the words come in. Both
// slides ease in and out alike, so the trip back reads as one smooth move, not a settle.
const REVEAL_SLIDE = { duration: DURATION.slower, ease: [0.65, 0, 0.35, 1] } as const;
export const REVEAL_WORDS = TRANSITION.fade;
export const REVEAL_TO_MIDDLE = { ...REVEAL_SLIDE, delay: REVEAL_WORDS.duration };
export const REVEAL_HOLD_S = 2;
export const REVEAL_BACK = { ...REVEAL_SLIDE, delay: REVEAL_HOLD_S };

// A right guess, in the modal: the card dips then pops, and at the pop's peak the stamp slams, the
// confetti bursts and the result text comes in.
const FOUND_POP_S = DURATION.slow;
const FOUND_POP_PEAK = 0.65;
export const FOUND_POP = { scale: [1, 0.97, 1.06, 1] };
export const FOUND_POP_TRANSITION = {
  duration: FOUND_POP_S,
  delay: DURATION.base,
  times: [0, 0.25, FOUND_POP_PEAK, 1],
  ease: EASE.game,
};
export const FOUND_STAMP_AT_MS = (DURATION.base + FOUND_POP_S * FOUND_POP_PEAK) * 1000;
