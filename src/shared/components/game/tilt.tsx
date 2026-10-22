"use client";

import { useReducedMotion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import ParallaxTilt from "react-parallax-tilt";

type TiltProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Turns the tilt off, e.g. for stickers fanned out behind another one. */
  disabled?: boolean;
};

/** Hover tilt for stickers and cards: 10 degrees, 1.03 scale, off for reduced motion. */
export function Tilt({ children, className, style, disabled = false }: TiltProps) {
  // MotionConfig does not reach this library. Reading the preference here is safe for hydration:
  // the tilt props only drive pointer handlers, never the rendered markup.
  const reduceMotion = useReducedMotion();
  const enabled = !disabled && !reduceMotion;

  // The library always sets a 3D transform, even with the tilt off. That puts the card on its own
  // layer, which blurs its edges and steps through sub-pixel moves when a parent slides or scales it.
  if (disabled) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <ParallaxTilt
      className={className}
      style={style}
      tiltEnable={enabled}
      tiltMaxAngleX={10}
      tiltMaxAngleY={10}
      perspective={900}
      scale={enabled ? 1.03 : 1}
      transitionSpeed={500}
      glareEnable={false}
    >
      {children}
    </ParallaxTilt>
  );
}
