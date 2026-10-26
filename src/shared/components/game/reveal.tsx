"use client";

import { motion, type Transition, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { TRANSITION } from "./game-motion";

type RevealVariant = "fade" | "land";

const LAND_PX = 80;
const LAND_TILT_DEG = -6;

const VARIANTS: Record<RevealVariant, Variants> = {
  fade: { hidden: { opacity: 0 }, shown: { opacity: 1 } },
  land: {
    hidden: { opacity: 0, y: LAND_PX, rotate: LAND_TILT_DEG },
    shown: { opacity: 1, y: 0, rotate: 0 },
  },
};

// The welcome tour's arrival, so every screen settles in the same way.
const ARRIVAL: Record<RevealVariant, Transition> = {
  fade: TRANSITION.arrive,
  land: TRANSITION.land,
};

type RevealProps = {
  children: ReactNode;
  /** fade for text and anything else, land for a card set down on the stage. */
  variant?: RevealVariant;
  /** Seconds, from `beats()` or `stagger()`. */
  delay?: number;
  as?: "div" | "li";
  /** Runs once the content has settled. */
  onShown?: () => void;
  className?: string;
};

/**
 * Shows content on mount. Text only fades, never moves or scales: the browser draws a moving line
 * soft and snaps it sharp once it stops. Cards move by translate, rotate and opacity only, since scaling one
 * mid-flight resamples its edges and shimmers.
 */
export function Reveal({
  children,
  variant = "fade",
  delay = 0,
  as = "div",
  onShown,
  className,
}: RevealProps) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      variants={VARIANTS[variant]}
      initial="hidden"
      animate="shown"
      transition={{ ...ARRIVAL[variant], delay }}
      onAnimationComplete={onShown}
    >
      {children}
    </Component>
  );
}
