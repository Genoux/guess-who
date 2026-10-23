"use client";

import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "motion/react";
import { Dialog } from "radix-ui";
import { useState } from "react";
import {
  BACKDROP_DELAY_S,
  BACKDROP_FADE_S,
  CONTENT_FADE_S,
  FLIGHT,
  FLIGHT_S,
  OPEN_SCALE,
} from "../lib/album-motion";
import type { CollectTarget } from "../queries/get-collect-target";
import { CollectBar, CollectDetail } from "./collect-detail";

type AlbumCardOverlayProps = {
  /** The open card; null while closed. Updates in place when the server refreshes the album. */
  target: CollectTarget | null;
  /** The layoutId the grid card flies under. */
  flightId: string;
  /** The hand-stuck angle the card flies back to. */
  rotation: number;
  onClose: () => void;
  /** Runs once the last of the overlay, the backdrop, has faded out. */
  onExited?: () => void;
};

/**
 * The collect detail over the album. The card is the grid card's shared element (same layoutId),
 * so it flies out of its slot and back; the text fades in after it lands and out before it
 * leaves. The backdrop is the first thing in, and on the way out it fades while the card is in the
 * air, so the album and the empty slot are there to see it land.
 */
export function AlbumCardOverlay({
  target,
  flightId,
  rotation,
  onClose,
  onExited,
}: AlbumCardOverlayProps) {
  const reduceMotion = useReducedMotion();
  // The exit holds the overlay layer until the card has landed; reduced motion has no flight.
  const landedAt = reduceMotion ? 0 : FLIGHT_S;

  return (
    <Dialog.Root open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal forceMount>
        <AnimatePresence onExitComplete={onExited}>
          {target ? (
            <Dialog.Overlay key="backdrop" asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-game-bg"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { delay: BACKDROP_DELAY_S, duration: BACKDROP_FADE_S },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: BACKDROP_FADE_S },
                }}
              />
            </Dialog.Overlay>
          ) : null}
          {target ? (
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
                document.querySelector<HTMLElement>(`[data-card-id="${target.id}"]`)?.focus();
              }}
            >
              <motion.div
                className="fixed inset-0 z-50 flex flex-col overflow-y-auto font-game-sans text-base text-game-ink outline-none"
                // Holds the layer until the card has landed; the card itself is flown by its layoutId.
                exit={{ opacity: 0, transition: { delay: landedAt, duration: 0.01 } }}
                // Empty space lets the click through to the backdrop, so Radix reads it as an outside click.
                style={{ pointerEvents: "none" }}
              >
                <OverlayBody
                  target={target}
                  flightId={flightId}
                  rotation={rotation}
                  onClose={onClose}
                />
              </motion.div>
            </Dialog.Content>
          ) : null}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type OverlayBodyProps = Pick<AlbumCardOverlayProps, "flightId" | "rotation" | "onClose"> & {
  target: CollectTarget;
};

function OverlayBody({ target, flightId, rotation, onClose }: OverlayBodyProps) {
  const isPresent = useIsPresent();
  const [landed, setLanded] = useState(false);

  return (
    <>
      <motion.div
        className="flex flex-none items-center justify-between px-4 py-5 md:px-10 [&>*]:pointer-events-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: BACKDROP_DELAY_S, duration: BACKDROP_FADE_S } }}
        exit={{ opacity: 0, transition: { duration: CONTENT_FADE_S } }}
      >
        <CollectBar target={target} onClose={onClose} />
      </motion.div>

      <div className="m-auto w-full px-4 pt-2 pb-16 md:px-10">
        <CollectDetail
          target={target}
          headingAs={Dialog.Title}
          tilt={landed && isPresent}
          wrapCard={(card) => (
            // The album's own small card, zoomed: zoom lays it out and paints it at the large size, so
            // the text stays the same and sharp, where scale() would stretch a small bitmap. The zoom
            // sits inside the layoutId element, whose transforms would otherwise be zoomed too.
            // One card on screen: no crossfade with the grid copy, and this copy vanishes the
            // instant the grid copy takes off from the same spot.
            <motion.div
              className="pointer-events-auto"
              layoutId={flightId}
              // Re-measures only for a new card: a server refresh (saving a note) re-rendered it while
              // this layer was scrolled, misread the scroll as movement and flew it back into place.
              // layoutScroll on the layer fixes that but breaks the flight home to the album.
              layoutDependency={flightId}
              layoutCrossfade={false}
              transition={{ layout: FLIGHT }}
              exit={{ opacity: 0, transition: { duration: 0 } }}
            >
              <motion.div
                style={{ zoom: OPEN_SCALE }}
                initial={{ rotate: rotation }}
                animate={{ rotate: 0, transition: FLIGHT }}
                onAnimationComplete={() => setLanded(true)}
              >
                {card}
              </motion.div>
            </motion.div>
          )}
          wrapContent={(content) => (
            <motion.div
              className="pointer-events-auto w-full"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { delay: BACKDROP_DELAY_S, duration: BACKDROP_FADE_S },
              }}
              exit={{ opacity: 0, transition: { duration: CONTENT_FADE_S } }}
            >
              {content}
            </motion.div>
          )}
        />
      </div>
    </>
  );
}
