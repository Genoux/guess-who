"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { GAME_EASE } from "./game-motion";

type PageTransitionProps = {
  children: ReactNode;
  className?: string;
};

/** Fades a game screen up on arrival; use it in a route `template.tsx` so it replays per page. */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: GAME_EASE }}
    >
      {children}
    </motion.div>
  );
}
