"use client";

import { motion, type Transition } from "motion/react";
import Link from "next/link";
import { type ElementType, type ReactNode, useId, useRef, useState } from "react";
import { CardDetail } from "@/shared/components/game/card-detail";
import { CloseButton } from "@/shared/components/game/close-button";
import { GameButton } from "@/shared/components/game/game-button";
import { GameTopNav } from "@/shared/components/game/game-top-nav";
import { Sticker } from "@/shared/components/game/sticker";
import { ROUTES } from "@/shared/config/routes";
import type { FoundSequence } from "../hooks/use-found-sequence";
import { FOUND_CLEAR, REVEAL_WORDS } from "../lib/album-motion";
import type { CollectTarget } from "../queries/get-collect-target";
import type { FoundStats } from "../server/to-game-outcome";
import { OVERLAY_FADE } from "./card-overlay";
import { FoundWords } from "./found-words";
import { StickerGuess } from "./sticker-guess";
import { StickerMaybe } from "./sticker-maybe";
import { StickerNotes } from "./sticker-notes";

type CollectBarProps = {
  /** Closes in place; without it the control is a link back to the album. */
  onClose?: () => void;
  /** The guess found the welcomer: no way out while the reveal plays, then the mission. */
  reveal?: "playing" | "told";
  tone?: "soft" | "on-color";
};

/** The logo and the close control above a collect detail. */
export function CollectBar({ onClose, reveal, tone = "soft" }: CollectBarProps) {
  return (
    <GameTopNav
      tone="clear"
      end={
        reveal === "playing" ? (
          <CloseButton
            tone={tone}
            label="Back to album"
            className="invisible"
            disabled
            aria-hidden
            tabIndex={-1}
          />
        ) : reveal === "told" ? (
          <CloseButton asChild tone={tone} label="Go to your mission">
            <Link href={ROUTES.playMission} />
          </CloseButton>
        ) : onClose ? (
          <CloseButton tone={tone} label="Back to album" onClick={onClose} />
        ) : (
          <CloseButton asChild tone={tone} label="Back to album">
            <Link href={ROUTES.play} />
          </CloseButton>
        )
      }
    />
  );
}

type CollectDetailProps = {
  target: CollectTarget;
  /** The numbers of the find once the guess was right; the card then plays the reveal in place. */
  find: FoundStats | null;
  onFound: (stats: FoundStats) => void;
  sequence: FoundSequence;
  /** What the card sits on: the orange stage once the album overlay is flooded. */
  backdrop?: "light" | "found";
  /** The element that carries the name, so a dialog can make it its title. */
  headingAs?: ElementType;
  tilt?: boolean;
  /** What the card mounts as: closed, so the overlay opens it as it flies in. */
  expandedFrom?: boolean;
  /** The motion of the card opening, e.g. the flight it rides in on. */
  expandTransition?: Transition;
  /** Frames the card; the album overlay flies it in from its slot. */
  wrapCard?: (card: ReactNode) => ReactNode;
  /** Frames everything but the card; the album overlay fades it in once the card lands. */
  wrapContent?: (content: ReactNode) => ReactNode;
};

// The album's own small card, zoomed: the same card in the grid and open, only larger and with
// its fact and ask opened.
const zoomed = (card: ReactNode) => <div className="zoom-open">{card}</div>;
const keep = (node: ReactNode) => node;

/**
 * One sticker, open. The card and its mission switch on the left, with its ask behind the +
 * button; on the right the player's notes and the one action on the card. A right guess clears
 * all but the card, which then plays the reveal where it stands.
 */
export function CollectDetail({
  target,
  find,
  onFound,
  sequence,
  backdrop = "light",
  headingAs: Heading = "h1",
  tilt = true,
  expandedFrom,
  expandTransition,
  wrapCard = zoomed,
  wrapContent = keep,
}: CollectDetailProps) {
  const { person } = target;
  const wordsRef = useRef<HTMLDivElement>(null);
  const notesFormId = useId();
  const [collecting, setCollecting] = useState(false);

  // The refresh the guess triggers ends the game, so what is on screen keeps to the local find
  // until the reveal is over, not to `target`.
  const fadeOut = (content: ReactNode, onCleared?: () => void) => (
    <motion.div
      animate={{ opacity: find ? 0 : 1 }}
      transition={FOUND_CLEAR}
      inert={find !== null}
      onAnimationComplete={find ? onCleared : undefined}
    >
      {content}
    </motion.div>
  );

  return (
    <CardDetail
      className={sequence.cleared ? "md:grid-cols-1" : undefined}
      card={
        <motion.div
          ref={sequence.cardRef}
          style={{ x: sequence.x, y: sequence.y, scale: sequence.scale }}
        >
          {wrapCard(
            <div className={sequence.cleared ? "zoom-reveal" : undefined}>
              <Sticker
                person={person}
                mode={find ? (sequence.stamped ? "found" : "collected") : target.mode}
                size="sm"
                expanded
                expandedFrom={expandedFrom}
                expandTransition={expandTransition}
                askToggle
                backdrop={backdrop}
                tilt={tilt}
              />
            </div>,
          )}
        </motion.div>
      }
      cardFooter={
        sequence.cleared && find ? (
          <motion.div
            ref={wordsRef}
            // The guess row that had focus is gone. Focus lands on the result, not on the X, whose
            // tooltip opens on focus.
            tabIndex={-1}
            className="pointer-events-auto flex flex-col items-center gap-2 outline-none"
            initial={false}
            animate={{ opacity: sequence.told ? 1 : 0 }}
            exit={OVERLAY_FADE.exit}
            transition={REVEAL_WORDS}
            onAnimationComplete={sequence.told ? () => wordsRef.current?.focus() : undefined}
            aria-hidden={!sequence.told}
            inert={!sequence.told}
          >
            <FoundWords
              found
              firstName={target.firstName}
              foundOnDay={find.foundOnDay}
              cluesUsed={find.cluesUsed}
              titleAs={Heading}
            />
          </motion.div>
        ) : find || (target.active && target.collected && !target.ruled) ? (
          fadeOut(wrapContent(<StickerMaybe target={target} />))
        ) : null
      }
      panel={
        sequence.cleared
          ? undefined
          : fadeOut(
              wrapContent(
                <div className="flex flex-col gap-6">
                  {/* The card prints the name; this keeps the dialog labelled. */}
                  <Heading className="sr-only">{person.name}</Heading>
                  <StickerNotes
                    target={target}
                    formId={notesFormId}
                    onPendingChange={setCollecting}
                  />
                </div>,
              ),
              sequence.clear,
            )
      }
      footer={
        sequence.cleared
          ? null
          : fadeOut(
              wrapContent(
                <div className="flex justify-center">
                  {!target.collected ? (
                    // Submits the notes form from here: one submission, the button and the field's
                    // own Enter alike, and the form's pending state disables the button.
                    <GameButton type="submit" form={notesFormId} size="lg" disabled={collecting}>
                      Collect sticker
                    </GameButton>
                  ) : find || target.active ? (
                    // Not gated on `ruled`: the guess keeps its "Not X." moment open after the
                    // card is ruled out, and renders nothing once that closes.
                    <StickerGuess target={target} onFound={onFound} />
                  ) : null}
                </div>,
              ),
            )
      }
    />
  );
}
