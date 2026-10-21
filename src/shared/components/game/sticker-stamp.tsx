"use client";

import { cva } from "class-variance-authority";
import { XIcon } from "lucide-react";
import { motion } from "motion/react";
import { STAMP_EASE } from "./game-motion";
import type { StickerSize, StickerStamp } from "./sticker-view";

const stampVariants = cva("pointer-events-none absolute z-3 flex items-center justify-center", {
  variants: {
    stamp: {
      maybe:
        "rounded-full bg-game-shortlist font-game-mono text-game-ink uppercase tracking-caption",
      ruled: "top-[30%] left-1/2 rounded-full bg-game-ink text-white",
      found:
        "top-[30%] left-1/2 whitespace-nowrap rounded-game-md bg-game-found font-game-serif text-white",
    },
    size: { sm: "", lg: "" },
  },
  compoundVariants: [
    { stamp: "maybe", size: "sm", className: "-top-3 -right-3 size-14 text-meta" },
    { stamp: "maybe", size: "lg", className: "-top-4 -right-4 size-20 text-small" },
    { stamp: "ruled", size: "sm", className: "size-13 [&_svg]:size-5.5" },
    { stamp: "ruled", size: "lg", className: "size-19 [&_svg]:size-8" },
    { stamp: "found", size: "sm", className: "px-4 py-2 text-stamp" },
    { stamp: "found", size: "lg", className: "px-5 py-2.5 text-stamp-lg" },
  ],
});

const STAMP_ROTATION: Record<StickerStamp, number> = { maybe: 12, ruled: 0, found: -8 };

/**
 * The maybe, not-them and found marks stamped on a sticker. Reduced motion comes from the
 * MotionConfig in GameShell, so `initial` is the same on the server and the client.
 */
export function StickerStampMark({ stamp, size }: { stamp: StickerStamp; size: StickerSize }) {
  const centred = stamp !== "maybe";
  return (
    <motion.span
      className={stampVariants({ stamp, size })}
      style={{ x: centred ? "-50%" : 0, rotate: STAMP_ROTATION[stamp] }}
      initial={{ opacity: 0, scale: 1.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.12 } }}
      transition={{ duration: 0.26, ease: STAMP_EASE }}
      {...(stamp === "ruled" ? { role: "img", "aria-label": "Not them" } : {})}
    >
      {stamp === "maybe" ? "Maybe" : null}
      {stamp === "ruled" ? <XIcon aria-hidden strokeWidth={2.5} /> : null}
      {stamp === "found" ? "Found" : null}
    </motion.span>
  );
}
