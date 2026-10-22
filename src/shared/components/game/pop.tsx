"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

type PopProps = {
  children: ReactNode;
  /** Seconds to wait, to stagger a title after a sticker. */
  delay?: number;
  /** Runs once the content has popped in. */
  onShown?: () => void;
  className?: string;
};

/** Pops content in (scale 0.6 to 1.06 to 1) on mount; reduced motion keeps only the fade. */
export function Pop({ children, delay = 0, onShown, className }: PopProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: [0.6, 1.06, 1] }}
      transition={{ duration: 0.42, delay, times: [0, 0.6, 1], ease: "easeOut" }}
      onAnimationComplete={onShown}
    >
      {children}
    </motion.div>
  );
}
