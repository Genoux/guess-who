"use client";

import { motion, useMotionValue, useTransform } from "motion/react";
import { type ReactNode, useRef } from "react";
import { gameCn } from "./game-cn";
import { TRANSITION } from "./game-motion";

type FlipProps = {
  /** Shows the back face; changing it turns the card. */
  flipped: boolean;
  front: ReactNode;
  back: ReactNode;
  /** Seconds before the turn starts, for a beat after the card arrives. */
  delay?: number;
  /** Runs once the turn has landed, for effects that follow it (confetti, a chip). */
  onFlipped?: () => void;
  className?: string;
};

const LIFT_PX = 8;

const toDegrees = (value: string | number | undefined) =>
  typeof value === "string" ? Number.parseFloat(value) : (value ?? 0);

const atRest = (degrees: number) => Math.abs(Math.sin((degrees * Math.PI) / 180)) < 0.001;

/**
 * A two-faced card turn. Every frame reads one angle: the card turns in 3D, each face shows only
 * on its half of the turn, and the back face is un-mirrored while it faces away. At rest the card
 * has no transform at all, so the edges stay smooth and nothing can show the wrong face.
 */
export function Flip({ flipped, front, back, delay = 0, onFlipped, className }: FlipProps) {
  const rotateY = useMotionValue(flipped ? 180 : 0);
  const frontVisibility = useTransform(rotateY, (angle) => (angle < 90 ? "visible" : "hidden"));
  const backVisibility = useTransform(rotateY, (angle) => (angle < 90 ? "hidden" : "visible"));
  const backScaleX = useTransform(rotateY, (angle) => (atRest(angle) ? 1 : -1));
  // Visibility keeps the hidden face out of the accessibility tree, but a nested Flip's faces set
  // their own visibility and would paint through it; opacity hides the whole subtree for good.
  const frontOpacity = useTransform(rotateY, (angle) => (angle < 90 ? 1 : 0));
  const backOpacity = useTransform(rotateY, (angle) => (angle < 90 ? 0 : 1));
  // Those nested visible faces still catch the pointer, so the hidden face would steal the hover.
  // The shown face inherits rather than forcing `auto`, which would switch a nested Flip's face
  // back on inside a hidden one.
  const frontPointer = useTransform(rotateY, (angle) => (angle < 90 ? "inherit" : "none"));
  const backPointer = useTransform(rotateY, (angle) => (angle < 90 ? "none" : "inherit"));
  // Only a landed turn counts: motion 12.43 replays the mount animation after a StrictMode
  // remount (its `initial={false}` guard skips `wasReset`), and that completes without a turn.
  const restingFlipped = useRef(flipped);
  const landed = () => {
    if (restingFlipped.current === flipped) return;
    restingFlipped.current = flipped;
    onFlipped?.();
  };

  return (
    <motion.div
      className={gameCn("relative", className)}
      style={{ rotateY }}
      initial={false}
      animate={{ rotateY: flipped ? 180 : 0 }}
      transition={{ ...TRANSITION.flip, delay }}
      transformTemplate={({ rotateY: value }) => {
        const degrees = toDegrees(value);
        if (atRest(degrees)) return "none";
        const lift = Math.sin((degrees * Math.PI) / 180) * LIFT_PX;
        return `perspective(800px) translateY(${-lift}px) rotateY(${degrees}deg)`;
      }}
      onAnimationComplete={landed}
    >
      <motion.div
        className="absolute inset-0"
        style={{ visibility: frontVisibility, opacity: frontOpacity, pointerEvents: frontPointer }}
      >
        {front}
      </motion.div>
      <motion.div
        className="absolute inset-0"
        style={{
          visibility: backVisibility,
          opacity: backOpacity,
          scaleX: backScaleX,
          pointerEvents: backPointer,
        }}
      >
        {back}
      </motion.div>
    </motion.div>
  );
}
