"use client";

import { useIsPresent, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { TRANSITION } from "@/shared/components/game/game-motion";

/** Arrivals wait for the leaving view, so the two never cross. */
export const AFTER_LEAVE_S = TRANSITION.exit.duration;

/**
 * One step of a wizard swapping for the next; `custom` is 1 forward, -1 back (the way back
 * mirrors), and 0 on first load, when nothing is leaving to wait for. The leaving one fades out
 * in place.
 */
export const STEP_MOTION: Variants = {
  enter: (direction: number) => ({ opacity: 0, y: direction < 0 ? -32 : 24 }),
  center: (direction: number) => ({
    opacity: 1,
    y: 0,
    transition: { ...TRANSITION.arrive, delay: direction === 0 ? 0 : AFTER_LEAVE_S },
  }),
  // Fades in place, quick off the mark: the exit ease starts so slow that the view hung, nudged a
  // pixel, then vanished. Same length as the exit, so AFTER_LEAVE_S still holds.
  exit: { opacity: 0, transition: TRANSITION.enter },
};

/**
 * A card swapping for the next on one spot: it comes in from the side we are moving towards and
 * leaves the other way. Enter and leave read `custom`, since a leaving child no longer gets new
 * props; the arrival's timing is the caller's.
 */
export const SLIDE_MOTION: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: 96 * direction }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: -64 * direction, transition: TRANSITION.exit }),
};

/** Takes a leaving view out of focus and clicks while it fades, so a double click never fires twice. */
export function InertWhenLeaving({ children }: { children: ReactNode }) {
  const isPresent = useIsPresent();
  return (
    <div className="contents" inert={!isPresent}>
      {children}
    </div>
  );
}
