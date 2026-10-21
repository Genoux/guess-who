"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * The one reduced-motion switch for the game layer: with "user", motion skips transform and
 * layout animations when the OS asks for less motion, so components keep a stable `initial`
 * and never branch on the preference during render (no hydration mismatch).
 */
export function GameMotionConfig({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
