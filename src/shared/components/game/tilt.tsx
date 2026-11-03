"use client";

import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { type CSSProperties, type PointerEvent, type ReactNode, useEffect, useRef } from "react";

type TiltProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Turns the tilt off, e.g. for stickers fanned out behind another one. */
  disabled?: boolean;
};

const MAX_TILT_DEG = 8;
// The card rises up and to the left while its shadow stays on the page: the gap reads as height.
const RISE_PX = 3;
// The shadow sits 6px out when the card lifts flat. Light comes from the top left, so the edge
// that dips towards the page casts a shorter shadow: 0.5px less per degree, about 2px at 8°.
const SHADOW_PX = 6;
const SHADOW_PX_PER_DEG = 0.5;
const PERSPECTIVE_PX = 900;
const SPRING = { stiffness: 260, damping: 22, mass: 0.6 };

const toNumber = (value: string | number | undefined) =>
  typeof value === "string" ? Number.parseFloat(value) : (value ?? 0);

const atRest = (amount: number) => Math.abs(amount) < 0.05;

/**
 * Hover tilt for stickers and cards: the card rises and leans towards the pointer in 3D, and
 * `--lift`, `--shadow-x` and `--shadow-y` slide the hard shadow out from under it. A 3D
 * layer only antialiases edges inside its own bounds, so the transparent outline widens the
 * layer and keeps the card's border smooth; flat again, the card drops the 3D transform and
 * repaints crisp.
 */
export function Tilt({ children, className, style, disabled = false }: TiltProps) {
  const reduceMotion = useReducedMotion();
  const enabled = !disabled && !reduceMotion;
  const rotateX = useSpring(0, SPRING);
  const rotateY = useSpring(0, SPRING);
  const lift = useSpring(0, SPRING);
  const rise = useTransform(lift, (amount) => amount * -RISE_PX);
  // Tilting right (rotateY > 0) dips the right edge; tilting down (rotateX < 0) dips the bottom.
  const shadowX = useTransform(
    [lift, rotateY],
    ([amount = 0, turn = 0]: number[]) => amount * SHADOW_PX - turn * SHADOW_PX_PER_DEG,
  );
  const shadowY = useTransform(
    [lift, rotateX],
    ([amount = 0, turn = 0]: number[]) => amount * SHADOW_PX + turn * SHADOW_PX_PER_DEG,
  );
  const zoneRef = useRef<HTMLDivElement>(null);
  const setVar = (name: string, value: string) => zoneRef.current?.style.setProperty(name, value);
  useMotionValueEvent(lift, "change", (amount) => setVar("--lift", String(amount)));
  useMotionValueEvent(shadowX, "change", (offset) => setVar("--shadow-x", `${offset}px`));
  useMotionValueEvent(shadowY, "change", (offset) => setVar("--shadow-y", `${offset}px`));

  const follow = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const across = (event.clientX - bounds.left) / bounds.width - 0.5;
    const down = (event.clientY - bounds.top) / bounds.height - 0.5;
    rotateY.set(across * 2 * MAX_TILT_DEG);
    rotateX.set(-down * 2 * MAX_TILT_DEG);
    lift.set(1);
  };

  const settle = () => {
    rotateX.set(0);
    rotateY.set(0);
    lift.set(0);
  };

  // Turning the tilt off mid-hover removes the leave handler, so settle here instead.
  useEffect(() => {
    if (enabled) return;
    rotateX.set(0);
    rotateY.set(0);
    lift.set(0);
  }, [enabled, rotateX, rotateY, lift]);

  // The pointer is tracked on a wrapper that never moves: on the rising card itself, a pointer in
  // its bottom or right 3px would fall off the card, drop it, and catch it again in a loop.
  return (
    <div
      ref={zoneRef}
      className={className}
      style={style}
      onPointerMove={enabled ? follow : undefined}
      onPointerLeave={enabled ? settle : undefined}
    >
      <motion.div
        className="relative size-full [outline:2px_solid_transparent]"
        style={{ x: rise, y: rise, rotateX, rotateY }}
        transformTemplate={({ x, rotateX: turnX, rotateY: turnY }) => {
          const shift = toNumber(x);
          const tiltX = toNumber(turnX);
          const tiltY = toNumber(turnY);
          if (atRest(shift) && atRest(tiltX) && atRest(tiltY)) return "none";
          return `translate(${shift}px, ${shift}px) perspective(${PERSPECTIVE_PX}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
