"use client";

import { motion, useIsPresent } from "motion/react";
import { Dialog } from "radix-ui";
import { useState } from "react";
import { useFoundSequence } from "../hooks/use-found-sequence";
import type { CollectTarget } from "../queries/get-collect-target";
import type { FoundStats } from "../server/to-game-outcome";
import { CardOverlay, OVERLAY_FADE, OverlayCard } from "./card-overlay";
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

/** The collect detail over the album: the grid card flies out of its slot, the text fades in. */
export function AlbumCardOverlay({
  target,
  flightId,
  rotation,
  onClose,
  onExited,
}: AlbumCardOverlayProps) {
  const [find, setFind] = useState<FoundStats | null>(null);
  // Closed some other way, e.g. back: the next card opens as any other.
  if (!target && find) setFind(null);

  return (
    <CardOverlay
      open={target !== null}
      returnFocusTo={`[data-card-id="${target?.id}"]`}
      onClose={onClose}
      onExited={onExited}
      flooded={find !== null}
      dismissible={find === null}
    >
      {target ? (
        <OverlayBody
          key={target.id}
          target={target}
          find={find}
          onFound={setFind}
          flightId={flightId}
          rotation={rotation}
          onClose={onClose}
        />
      ) : null}
    </CardOverlay>
  );
}

type OverlayBodyProps = Pick<AlbumCardOverlayProps, "flightId" | "rotation" | "onClose"> & {
  target: CollectTarget;
  find: FoundStats | null;
  onFound: (stats: FoundStats) => void;
};

function OverlayBody({ target, find, onFound, flightId, rotation, onClose }: OverlayBodyProps) {
  const isPresent = useIsPresent();
  const [landed, setLanded] = useState(false);
  const sequence = useFoundSequence();

  return (
    <>
      <motion.div
        // Same bar as FoundReveal's, so the logo lines up with GameTopNav's under it.
        className="flex items-center justify-between px-4 pt-1 pb-2.5 md:h-18 md:px-10 md:py-0 [&>*]:pointer-events-auto"
        {...OVERLAY_FADE}
      >
        <CollectBar
          onClose={onClose}
          reveal={find ? (sequence.told ? "told" : "playing") : undefined}
          tone={find ? "on-color" : "soft"}
        />
      </motion.div>

      <div className="w-full px-4 py-8 md:px-10 flex items-center justify-center">
        <CollectDetail
          target={target}
          find={find}
          onFound={onFound}
          sequence={sequence}
          backdrop={find ? "found" : "light"}
          headingAs={Dialog.Title}
          tilt={landed && isPresent}
          wrapCard={(card) => (
            <OverlayCard
              flightId={flightId}
              rotation={rotation}
              zoomClass="zoom-open"
              onLanded={() => setLanded(true)}
            >
              {card}
            </OverlayCard>
          )}
          wrapContent={(content) => (
            <motion.div className="pointer-events-auto w-full" {...OVERLAY_FADE}>
              {content}
            </motion.div>
          )}
        />
      </div>
    </>
  );
}
