"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Dialog } from "radix-ui";
import type { ReactNode } from "react";
import { BACKDROP_IN, BACKDROP_OUT, CONTENT_OUT, CUT, FLIGHT, FLIGHT_S } from "../lib/album-motion";

/** Words around an open card: in after the card has taken off, out before it flies home. */
export const OVERLAY_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: BACKDROP_IN },
  exit: { opacity: 0, transition: CONTENT_OUT },
};

type CardOverlayProps = {
  open: boolean;
  /** Selector of the card on the page that gets focus back on close. */
  returnFocusTo: string;
  onClose: () => void;
  /** Runs once the last of the overlay, the backdrop, has faded out. */
  onExited?: () => void;
  children: ReactNode;
};

/**
 * A card opened in place over the page. The backdrop is the first thing in, and on the way out it
 * fades while the card is in the air, so the page and the empty slot are there to see it land.
 */
export function CardOverlay({
  open,
  returnFocusTo,
  onClose,
  onExited,
  children,
}: CardOverlayProps) {
  const reduceMotion = useReducedMotion();
  const landedAt = reduceMotion ? 0 : FLIGHT_S;

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal forceMount>
        <AnimatePresence onExitComplete={onExited}>
          {open ? (
            <Dialog.Overlay key="backdrop" asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-game-bg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: BACKDROP_IN }}
                exit={{ opacity: 0, transition: BACKDROP_OUT }}
              />
            </Dialog.Overlay>
          ) : null}
          {open ? (
            <Dialog.Content
              key="card"
              asChild
              forceMount
              aria-describedby={undefined}
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                (event.currentTarget as HTMLElement | null)?.focus();
              }}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                document.querySelector<HTMLElement>(returnFocusTo)?.focus();
              }}
            >
              <motion.div
                className="fixed inset-0 z-50 flex flex-col overflow-y-auto font-game-sans text-base text-game-ink outline-none"
                // The layer stays until the card, flown by its layoutId, has landed (at once under
                // reduced motion, which has no flight); then it goes in one cut.
                exit={{ opacity: 0, transition: { ...CUT, delay: landedAt } }}
                // Empty space lets the click through to the backdrop, so Radix reads it as an outside click.
                style={{ pointerEvents: "none" }}
              >
                {children}
              </motion.div>
            </Dialog.Content>
          ) : null}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type OverlayCardProps = {
  /** The layoutId the card on the page flies under. */
  flightId: string;
  /** The hand-placed angle the card flies out of and back to. */
  rotation: number;
  /** The small card zoomed to its open size. */
  scale: number;
  onLanded?: () => void;
  children: ReactNode;
};

/** The page's own card, flown out of its slot and zoomed, so it is the same card, only larger. */
export function OverlayCard({ flightId, rotation, scale, onLanded, children }: OverlayCardProps) {
  return (
    // zoom lays the small card out and paints it at the large size, so the text stays the same and
    // sharp, where scale() would stretch a small bitmap. It sits inside the layoutId element, whose
    // transforms would otherwise be zoomed too. One card on screen: no crossfade with the page copy,
    // and this copy vanishes the instant the page copy takes off from the same spot.
    <motion.div
      className="pointer-events-auto"
      layoutId={flightId}
      // Re-measures only for a new card: a server refresh re-rendered it while this layer was
      // scrolled, misread the scroll as movement and flew it back into place. layoutScroll on the
      // layer fixes that but breaks the flight home.
      layoutDependency={flightId}
      layoutCrossfade={false}
      transition={{ layout: FLIGHT }}
      exit={{ opacity: 0, transition: CUT }}
    >
      <motion.div
        style={{ zoom: scale }}
        initial={{ rotate: rotation }}
        animate={{ rotate: 0, transition: FLIGHT }}
        onAnimationComplete={onLanded}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
