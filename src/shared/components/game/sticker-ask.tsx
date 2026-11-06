"use client";

import { motion, useReducedMotion } from "motion/react";
import { type KeyboardEvent, useId, useRef, useState } from "react";
import { gameCn } from "./game-cn";
import { GameTooltip } from "./game-tooltip";
import { askContentVariants, askPanelVariants, askToggleFade } from "./sticker-motion";
import type { StickerSize } from "./sticker-view";

// The panel's vertical padding mirrors the locked face's ask box.
const PANEL_PADDING_Y: Record<StickerSize, string> = { sm: "py-2.5", lg: "py-4" };

type StickerAskProps = {
  ask: string;
  tint: string;
  tintInk?: string;
  /** The type steps of the locked face, so the ask reads at the size it did there. */
  askTextClass: string;
  size: StickerSize;
  /** The + button is visible and usable; hidden, it takes no focus and no click. */
  shown: boolean;
  /** Whether it mounts visible, so it can fade out or in on arrival. */
  shownFrom: boolean;
  /** Holds the ask open while true, e.g. while its field has focus; it closes again after, unless the viewer opened it. */
  revealed?: boolean;
};

/**
 * A + button in the card's top-right corner that grows the ask over the face, in the box the
 * locked face prints it in. Sized by the `ask-geometry` variables on the face it sits in.
 */
export function StickerAsk({
  ask,
  tint,
  tintInk,
  askTextClass,
  size,
  shown,
  shownFrom,
  revealed = false,
}: StickerAskProps) {
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion() ?? false;
  const [open, setOpen] = useState(revealed);
  const [openedByReveal, setOpenedByReveal] = useState(revealed);
  const [wasRevealed, setWasRevealed] = useState(revealed);

  if (revealed !== wasRevealed) {
    setWasRevealed(revealed);
    if (revealed && !open) {
      setOpen(true);
      setOpenedByReveal(true);
    } else if (!revealed && openedByReveal) {
      setOpen(false);
      setOpenedByReveal(false);
    }
  }

  const setViewerOpen = (next: boolean) => {
    setOpen(next);
    setOpenedByReveal(false);
  };

  const closeOnEscape = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Escape" || !open) return;
    setViewerOpen(false);
    toggleRef.current?.focus();
  };

  const label = open ? "Hide what to ask" : "Show what to ask";
  const content = askContentVariants(reducedMotion);

  return (
    <>
      <motion.div
        id={panelId}
        inert={!open}
        initial={false}
        animate={open ? "open" : "closed"}
        variants={askPanelVariants(reducedMotion)}
        className={gameCn(
          "ask-panel-clip absolute inset-(--ask-inset) z-10 flex flex-col justify-between gap-2 overflow-hidden px-(--ask-pad)",
          size === "sm" ? "rounded-card-art" : "rounded-card-art-lg",
          PANEL_PADDING_Y[size],
        )}
        style={{ backgroundColor: tint, color: tintInk }}
      >
        <motion.span variants={content} className="me-(--ask-clear) text-small">
          Ask me about
        </motion.span>
        <motion.p
          variants={content}
          className={gameCn("font-game-serif text-pretty wrap-anywhere", askTextClass)}
        >
          {ask}
        </motion.p>
      </motion.div>
      <GameTooltip label={label} side="left">
        <motion.button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={label}
          // Keeps focus in the field the ask was opened by, so the click is not a blur first.
          onMouseDown={(event) => event.preventDefault()}
          onKeyDown={closeOnEscape}
          onClick={() => {
            setViewerOpen(!open);
            toggleRef.current?.focus();
          }}
          inert={!shown}
          initial={{ opacity: shownFrom ? 1 : 0 }}
          animate={{ opacity: shown ? 1 : 0 }}
          transition={askToggleFade(reducedMotion)}
          className="group absolute top-(--ask-offset) right-(--ask-offset) z-20 grid size-(--ask-button) cursor-pointer after:absolute after:-inset-1.5 place-items-center rounded-full border-[length:calc(1.5px/var(--zoom-open))] border-game-ink bg-game-surface text-game-ink outline-none hover:bg-game-hover focus-visible:shadow-[0_0_0_2px_var(--color-game-surface),0_0_0_4px_var(--color-game-ink)]"
        >
          <svg viewBox="0 0 14 14" aria-hidden className="size-(--ask-icon)">
            <path d="M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path
              d="M7 1v12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="origin-center transition-transform duration-base ease-game group-aria-expanded:scale-y-0 motion-reduce:transition-none"
            />
          </svg>
        </motion.button>
      </GameTooltip>
    </>
  );
}
