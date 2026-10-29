import { beats, TRANSITION } from "@/shared/components/game/game-motion";

/** A new hire dealt into the list: the row lands like a card set down from above. */
export const ROW_DEAL = {
  initial: { opacity: 0, y: -10, rotate: -0.6 },
  animate: { opacity: 1, y: 0, rotate: 0 },
  transition: TRANSITION.land,
} as const;

/** The yellow wash behind the new row: it holds a beat, then fades slowly. */
export const ROW_GLOW = {
  initial: { opacity: 1 },
  animate: { opacity: 0 },
  transition: { duration: 2.4, delay: 0.5, ease: "easeOut" },
} as const;

/** The list settles in one beat after the heading. */
export const BOOK_DELAY_S = beats(1);
