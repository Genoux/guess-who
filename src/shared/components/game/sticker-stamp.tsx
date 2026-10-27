"use client";

import { cva } from "class-variance-authority";
import { type LucideIcon, PartyPopperIcon, XIcon } from "lucide-react";
import { motion } from "motion/react";
import { TRANSITION } from "./game-motion";
import type { StickerSize, StickerStamp } from "./sticker-view";

// A label taped across the card's top edge, so it never covers the face. `translate` centers it;
// motion owns `transform` for the stamp-in, so the two do not fight.
const stampVariants = cva(
  "pointer-events-none absolute top-0 left-1/2 z-3 flex -translate-x-1/2 -translate-y-1/2 items-center whitespace-nowrap rounded-sm border-2 font-game-serif",
  {
    variants: {
      stamp: {
        maybe: "border-game-ink bg-game-shortlist text-game-ink",
        ruled: "border-game-ink bg-game-ink text-white",
        found: "border-game-ink bg-game-found text-white",
        welcomer: "border-game-found bg-game-found text-white",
      },
      size: {
        sm: "gap-1 px-2.5 py-1 text-button-sm [&_svg]:size-3",
        lg: "gap-1.5 px-3.5 py-1.5 text-heading [&_svg]:size-4",
      },
    },
  },
);

const STAMP_ROTATION = -3;

const STAMP_CONTENT: Record<StickerStamp, { Icon: LucideIcon | null; label: string }> = {
  maybe: { Icon: null, label: "Maybe" },
  ruled: { Icon: XIcon, label: "Ruled out" },
  found: { Icon: PartyPopperIcon, label: "Found!" },
  welcomer: { Icon: PartyPopperIcon, label: "Welcomer" },
};

/**
 * The maybe, ruled-out and found marks stamped on a sticker. Reduced motion comes from the
 * MotionConfig in GameShell, so `initial` is the same on the server and the client.
 */
type StickerStampMarkProps = {
  stamp: StickerStamp;
  size: StickerSize;
};

export function StickerStampMark({ stamp, size }: StickerStampMarkProps) {
  const { Icon, label } = STAMP_CONTENT[stamp];
  return (
    <motion.span
      className={stampVariants({ stamp, size })}
      style={{ rotate: STAMP_ROTATION }}
      initial={{ opacity: 0, scale: 1.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: TRANSITION.clear }}
      transition={TRANSITION.stamp}
    >
      {label}
    </motion.span>
  );
}
