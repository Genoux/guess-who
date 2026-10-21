"use client";

import { cva } from "class-variance-authority";
import { PlusIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { type CelebratePalette, celebrate, originFromElement } from "@/shared/lib/celebrate";
import { gameCn } from "./game-cn";
import { FLIP_EASE } from "./game-motion";
import { StickerStampMark } from "./sticker-stamp";
import {
  getStickerView,
  type StickerMode,
  type StickerPerson,
  type StickerSize,
  stickerCelebration,
} from "./sticker-view";
import { Tilt } from "./tilt";

export type StickerProps = {
  person: StickerPerson;
  mode?: StickerMode;
  size?: StickerSize;
  /** Hand-stuck angle in degrees (-6 to 6), only in the album. */
  rot?: number;
  /** Hover tilt; off for stickers fanned out behind another one. */
  tilt?: boolean;
  /** Star burst when the sticker unlocks or turns found. */
  celebrateChanges?: boolean;
  /** Star colors for the background the sticker sits on: light, ink (dark) or orange (found). */
  celebratePalette?: CelebratePalette;
  className?: string;
};

const stickerVariants = cva("relative flex-none text-left text-game-ink", {
  variants: {
    size: { sm: "h-62 w-44", lg: "h-106 w-75" },
  },
});

// Faces swap visibility halfway through the 640ms flip. Only the visible face is ever styled:
// a filter or opacity on a 3D face breaks backface hiding and mirrors its text.
const faceVariants = cva(
  "absolute inset-0 flex flex-col bg-game-surface backface-hidden transition-[visibility] duration-0 delay-320 motion-reduce:delay-0",
  {
    variants: {
      size: {
        sm: "gap-2.5 rounded-sticker p-2",
        lg: "gap-3 rounded-sticker-lg p-2.5",
      },
      shadow: {
        edge: "shadow-edge",
        ink: "shadow-ink",
        maybe: "shadow-ink-maybe",
        found: "shadow-ink-found",
      },
    },
  },
);

const artVariants = cva("relative flex min-h-0 flex-1 overflow-hidden", {
  variants: {
    size: { sm: "rounded-sticker-art", lg: "rounded-sticker-art-lg" },
  },
});

const nameVariants = cva("truncate font-game-serif", {
  variants: {
    size: { sm: "text-name", lg: "text-name-lg" },
    muted: { true: "text-game-muted", false: "" },
  },
});

const metaVariants = cva("truncate font-game-mono uppercase text-game-muted", {
  variants: {
    size: { sm: "text-meta", lg: "text-caption" },
  },
});

const infoVariants = cva("flex min-w-0 flex-none flex-col", {
  variants: {
    size: { sm: "gap-0.5 px-1 pb-0.5", lg: "gap-1 px-1.5 pb-1" },
  },
});

const BACK_SHADOW: Record<StickerMode, "edge" | "ink" | "maybe" | "found"> = {
  locked: "ink",
  collected: "ink",
  maybe: "maybe",
  ruled: "edge",
  found: "found",
};

/** The person card: locked shows the ask-me-about line, every other mode the collected face. */
export function Sticker({
  person,
  mode = "collected",
  size = "sm",
  rot = 0,
  tilt = true,
  celebrateChanges = true,
  celebratePalette = "light",
  className,
}: StickerProps) {
  const view = getStickerView(person, mode, size);
  const rootRef = useRef<HTMLDivElement>(null);
  const previousMode = useRef(mode);
  const ruled = mode === "ruled";

  useEffect(() => {
    const kind = stickerCelebration(previousMode.current, mode);
    previousMode.current = mode;
    if (!kind || !celebrateChanges || !rootRef.current) return;
    void celebrate(originFromElement(rootRef.current), { kind, palette: celebratePalette });
  }, [mode, celebrateChanges, celebratePalette]);

  return (
    <div ref={rootRef} className={gameCn(stickerVariants({ size }), className)}>
      <Tilt className="relative size-full" disabled={!tilt}>
        <div
          className="relative size-full"
          style={rot ? { transform: `rotate(${rot}deg)` } : undefined}
        >
          <motion.div
            className="relative size-full transform-3d"
            initial={false}
            animate={{ rotateY: view.open ? 180 : 0 }}
            transition={{ duration: 0.64, ease: FLIP_EASE }}
            style={{ transformPerspective: 1200 }}
          >
            <div
              className={gameCn(
                faceVariants({ size, shadow: "edge" }),
                view.open ? "invisible" : "visible",
              )}
            >
              <div
                className={gameCn(
                  artVariants({ size }),
                  "flex-col justify-between gap-2",
                  size === "lg" ? "p-5" : "p-3",
                )}
                style={{ backgroundColor: person.tint }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-game-mono text-caption uppercase">Ask me about</span>
                  <span
                    className={gameCn(
                      "inline-flex flex-none items-center justify-center rounded-full bg-game-surface",
                      size === "lg" ? "size-7.5" : "size-5.5",
                    )}
                  >
                    <PlusIcon aria-hidden className="size-3.5" strokeWidth={2.25} />
                  </span>
                </div>
                <span
                  className={gameCn(
                    "line-clamp-5 font-game-serif",
                    size === "lg" ? "text-name-lg" : "text-quote",
                  )}
                >
                  {person.ask}
                </span>
              </div>
              <div className={infoVariants({ size })}>
                <span className={nameVariants({ size, muted: false })}>{person.name}</span>
                <span className={metaVariants({ size })}>{view.lockedMeta}</span>
              </div>
            </div>

            <div
              className={gameCn(
                faceVariants({ size, shadow: BACK_SHADOW[mode] }),
                "rotate-y-180",
                view.open ? "visible" : "invisible",
              )}
            >
              <div
                className={gameCn(
                  artVariants({ size }),
                  "items-center justify-center",
                  ruled && "bg-game-hover",
                )}
                style={ruled ? undefined : { backgroundColor: person.color }}
              >
                {person.photoUrl ? (
                  // biome-ignore lint/performance/noImgElement: photos are signed storage URLs sized at upload, not optimised per request
                  <img
                    src={person.photoUrl}
                    alt={person.name}
                    className={gameCn(
                      "absolute inset-0 size-full object-cover",
                      ruled && "opacity-30 grayscale",
                    )}
                  />
                ) : (
                  <span
                    aria-hidden
                    className={gameCn(
                      "font-game-serif",
                      size === "lg" ? "text-mark-lg" : "text-mark",
                      ruled
                        ? "text-game-muted"
                        : view.initialsTone === "white"
                          ? "text-white"
                          : "text-game-ink",
                    )}
                  >
                    {view.initials}
                  </span>
                )}
              </div>
              <div className={infoVariants({ size })}>
                <span className={nameVariants({ size, muted: ruled })}>{person.name}</span>
                <span className={metaVariants({ size })}>{view.openMeta}</span>
              </div>
              {view.showMore ? (
                <div className="flex flex-none flex-col gap-1.5 border-game-border border-t px-1.5 pt-3 pb-1">
                  {person.fact ? <p className="text-sm">{person.fact}</p> : null}
                  <span className="font-game-mono text-caption text-game-muted uppercase">
                    Ask me about · <span className="text-game-ink">{person.ask}</span>
                  </span>
                </div>
              ) : null}
            </div>
          </motion.div>
          <AnimatePresence>
            {view.stamp ? (
              <StickerStampMark key={view.stamp} stamp={view.stamp} size={size} />
            ) : null}
          </AnimatePresence>
        </div>
      </Tilt>
    </div>
  );
}
