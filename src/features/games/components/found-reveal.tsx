"use client";

import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { CloseButton } from "@/shared/components/game/close-button";
import { Flip } from "@/shared/components/game/flip";
import { GameButton } from "@/shared/components/game/game-button";
import { Sticker } from "@/shared/components/game/sticker";
import { ROUTES } from "@/shared/config/routes";
import { celebrate } from "@/shared/lib/celebrate";
import { markRevealSeen } from "../actions/mark-reveal-seen";
import { CUT, FLIGHT_S, REVEAL_BACK, REVEAL_TO_MIDDLE, REVEAL_WORDS } from "../lib/album-motion";
import { endingEyebrow } from "../lib/ending-eyebrow";
import type { GameOutcome } from "../server/to-game-outcome";
import { CardOverlay, OVERLAY_FADE, OverlayCard } from "./card-overlay";
import { FoundWords } from "./found-words";
import { IncognitoCard } from "./incognito-card";

type FoundOutcome = Extract<GameOutcome, { over: true }>;

// Zoomed on the card, not around the element that slides it: zoomed there, the slide to the
// middle would be zoomed too and stop short.
const CARD_SIZE = "h-106 w-75 zoom-reveal";
type RevealPhase = "gate" | "revealing" | "revealed";

type FoundRevealProps = {
  open: boolean;
  outcome: GameOutcome;
  onClose: () => void;
  /** Selector of the element that gets focus back on close. */
  returnFocusTo: string;
  /** Runs once the last of the overlay, the backdrop, has faded out. */
  onExited?: () => void;
  /** The layoutId of the card on the page, which flies out of it; with none there, it just appears. */
  flightId: string;
};

/**
 * The orange ending over the page: the welcomer's card and who it was. A player who never saw it
 * gets the face-down card with no way out until it has turned, which waits for a Reveal button.
 * Only a day 14 ending leaves it unseen: a right guess has its own reveal, on the guessed card.
 */
export function FoundReveal({
  open,
  outcome,
  onClose,
  returnFocusTo,
  onExited,
  flightId,
}: FoundRevealProps) {
  const startPhase: RevealPhase = outcome.over && outcome.revealSeen ? "revealed" : "gate";
  const [phase, setPhase] = useState<RevealPhase>(startPhase);
  const [wasOpen, setWasOpen] = useState(open);
  // Snapshot at each open, not live: marking it seen when the flip lands flips the outcome
  // mid-reveal.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setPhase(startPhase);
  }

  return (
    <CardOverlay
      open={open && outcome.over}
      tone="found"
      returnFocusTo={returnFocusTo}
      onClose={onClose}
      onExited={onExited}
      skipEnter={open}
      dismissible={phase === "revealed"}
    >
      {outcome.over ? (
        <FoundBody
          outcome={outcome}
          phase={phase}
          onReveal={() => setPhase("revealing")}
          onRevealed={() => setPhase("revealed")}
          flightId={flightId}
          onClose={onClose}
        />
      ) : null}
    </CardOverlay>
  );
}

type FoundBodyProps = Pick<FoundRevealProps, "flightId" | "onClose"> & {
  outcome: FoundOutcome;
  phase: RevealPhase;
  onReveal: () => void;
  onRevealed: () => void;
};

function FoundBody({ outcome, phase, onReveal, onRevealed, flightId, onClose }: FoundBodyProps) {
  const { found, welcomer, foundOnDay, cluesUsed } = outcome;
  const [startedRevealed] = useState(phase === "revealed");
  const [flipped, setFlipped] = useState(startedRevealed);
  // The gate's words are taller than the revealed ones; left in the layout, they would hold the
  // revealed screen above center.
  const [gateGone, setGateGone] = useState(startedRevealed);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardY = useMotionValue(0);
  const reduceMotion = useReducedMotion();
  // After the tap's build-up the card is already still, so the words follow at once.
  const wordsAt = startedRevealed ? FLIGHT_S : 0;
  const RevealedTitle = gateGone ? Dialog.Title : "h2";

  const celebrateFind = () =>
    void celebrate({ x: 0.5, y: 0.5 }, { kind: "found", palette: "found" });

  // Seen means the turn was watched: leaving before it lands plays the reveal again next time.
  const flipLanded = () => {
    celebrateFind();
    void markRevealSeen({});
  };

  // The words and the way out wait until the card is back in its place.
  const revealCard = async () => {
    onReveal();
    const card = cardRef.current;
    if (reduceMotion || !card) {
      setFlipped(true);
      setGateGone(true);
      flipLanded();
      onRevealed();
      return;
    }
    const bounds = card.getBoundingClientRect();
    const toMiddle = window.innerHeight / 2 - (bounds.top + bounds.height / 2);
    await animate(cardY, toMiddle, REVEAL_TO_MIDDLE);
    setFlipped(true);
  };

  // The turn has landed: confetti, the hold, then back up to its place.
  const settleCard = async () => {
    flipLanded();
    const card = cardRef.current;
    if (card) {
      // The gate leaves the layout while the card is held in the middle, and the screen re-centers
      // on the revealed words; the card is moved by the same amount, so it never jumps.
      const heldAt = card.getBoundingClientRect().top;
      flushSync(() => setGateGone(true));
      cardY.set(cardY.get() - (card.getBoundingClientRect().top - heldAt));
    }
    await animate(cardY, 0, REVEAL_BACK);
    onRevealed();
  };

  // The face-down card turns into the welcomer's, so that is the card that flies home.
  const card = (
    <motion.div ref={cardRef} style={{ y: cardY }}>
      <Flip
        className={CARD_SIZE}
        flipped={flipped}
        onFlipped={phase === "revealing" && !reduceMotion ? settleCard : undefined}
        front={<IncognitoCard />}
        back={
          <Sticker
            person={welcomer.person}
            mode={welcomer.mode}
            size="lg"
            backdrop="found"
            celebrateChanges={false}
          />
        }
      />
    </motion.div>
  );

  return (
    <>
      <motion.div
        // Lines the logo up with GameTopNav's so it stays put as this opens over the page; py-2.5
        // makes up for the close button being 4px taller than the nav's avatar.
        className="flex items-center justify-between border-transparent border-b px-4 pt-1 pb-2.5 md:h-18 md:px-6 md:py-0 lg:px-10 [&>*]:pointer-events-auto"
        {...OVERLAY_FADE}
      >
        <span className="font-game-serif whitespace-nowrap text-heading lg:text-logo">
          The Album
        </span>
        {phase === "gate" ? (
          <CloseButton asChild tone="on-color" label="Back to album">
            <Link href={ROUTES.play} />
          </CloseButton>
        ) : phase === "revealed" ? (
          <CloseButton tone="on-color" label="Close" onClick={onClose} />
        ) : (
          <CloseButton
            tone="on-color"
            label="Close"
            className="invisible"
            disabled
            aria-hidden
            tabIndex={-1}
          />
        )}
      </motion.div>

      <div className="mx-auto flex w-full max-w-260 flex-col items-center gap-8 px-4 text-center md:px-8">
        <OverlayCard flightId={flightId} rotation={0}>
          {card}
        </OverlayCard>
        <motion.div
          className="pointer-events-auto grid w-full justify-items-center"
          // Cut, not faded: the page's own heading shows through the fading backdrop right where
          // these words sit, and the two read as a doubled, glitching line.
          exit={{ opacity: 0, transition: CUT }}
        >
          {/* Under the revealed words until the card has turned, so the card does not shift as
              the gate fades. */}
          {gateGone ? null : (
            <motion.div
              className="col-start-1 row-start-1 flex flex-col items-center gap-8"
              animate={{ opacity: phase === "gate" ? 1 : 0 }}
              transition={REVEAL_WORDS}
              aria-hidden={phase !== "gate"}
              inert={phase !== "gate"}
            >
              <div className="flex flex-col items-center gap-2">
                <span className="font-game-mono text-caption uppercase">
                  {endingEyebrow({ found, revealSeen: false })}
                </span>
                <Dialog.Title className="text-balance font-game-serif text-hero-md md:text-hero">
                  Who was your welcomer?
                </Dialog.Title>
              </div>
              <GameButton onClick={revealCard}>Reveal</GameButton>
            </motion.div>
          )}
          {/* The gate's fade, reversed. Driven by animate, not mounted with an initial: an
              overlay opened on arrival skips every initial inside it, so it would just appear. */}
          <motion.div
            className="col-start-1 row-start-1 flex flex-col items-center gap-2"
            initial={startedRevealed ? { opacity: 0 } : false}
            animate={{ opacity: phase === "revealed" ? 1 : 0 }}
            transition={{ ...REVEAL_WORDS, delay: wordsAt }}
            onAnimationComplete={startedRevealed && found ? celebrateFind : undefined}
            aria-hidden={phase !== "revealed"}
            inert={phase !== "revealed"}
          >
            <FoundWords
              found={found}
              firstName={welcomer.firstName}
              foundOnDay={foundOnDay}
              cluesUsed={cluesUsed}
              titleAs={RevealedTitle}
            />
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
