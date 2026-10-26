"use client";

import { motion, useIsPresent } from "motion/react";
import { Dialog } from "radix-ui";
import { useState } from "react";
import { OPEN_SCALE } from "../lib/album-motion";
import type { CollectTarget } from "../queries/get-collect-target";
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
  return (
    <CardOverlay
      open={target !== null}
      returnFocusTo={`[data-card-id="${target?.id}"]`}
      onClose={onClose}
      onExited={onExited}
    >
      {target ? (
        <OverlayBody target={target} flightId={flightId} rotation={rotation} onClose={onClose} />
      ) : null}
    </CardOverlay>
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
        {...OVERLAY_FADE}
      >
        <CollectBar target={target} onClose={onClose} />
      </motion.div>

      <div className="m-auto w-full px-4 pt-2 pb-16 md:px-10">
        <CollectDetail
          target={target}
          headingAs={Dialog.Title}
          tilt={landed && isPresent}
          wrapCard={(card) => (
            <OverlayCard
              flightId={flightId}
              rotation={rotation}
              scale={OPEN_SCALE}
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
