"use client";

import { motion, useAnimate, useReducedMotion } from "motion/react";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { useState } from "react";
import { CloseButton } from "@/shared/components/game/close-button";
import { Flip } from "@/shared/components/game/flip";
import { GameButton } from "@/shared/components/game/game-button";
import { beats, TRANSITION } from "@/shared/components/game/game-motion";
import { Reveal } from "@/shared/components/game/reveal";
import { Sticker } from "@/shared/components/game/sticker";
import { ROUTES } from "@/shared/config/routes";
import { celebrate } from "@/shared/lib/celebrate";
import { markRevealSeen } from "../actions/mark-reveal-seen";
import { CUT, FLIGHT_S, REVEAL_BACK, REVEAL_TO_MIDDLE, REVEAL_WORDS } from "../lib/album-motion";
import type { GameOutcome } from "../server/to-game-outcome";
import { CardOverlay, OVERLAY_FADE, OverlayCard } from "./card-overlay";
import { foundLead } from "./found-lead";
import { IncognitoCard } from "./incognito-card";

type FoundOutcome = Extract<GameOutcome, { over: true }>;

const CARD_SIZE = "h-106 w-75";
const LANDED_STICKER_AT = beats(1);
const LANDED_STICKER_DONE_AT = LANDED_STICKER_AT + TRANSITION.land.duration;
type RevealPhase = "gate" | "revealing" | "revealed";
const LANDED_STICKER_ROTATION = -2;

type FoundRevealProps = {
  open: boolean;
  outcome: GameOutcome;
  onClose: () => void;
  /** Selector of the element that gets focus back on close. */
  returnFocusTo: string;
  /** Runs once the last of the overlay, the backdrop, has faded out. */
  onExited?: () => void;
  /**
   * The layoutId of the card on the page, which flies out of it; without it the card lands. With
   * no card on the page to fly from, it just appears.
   */
  flightId?: string;
  /** The hand-placed angle the page's card flies out of and back to. */
  rotation?: number;
};

/**
 * The orange ending over the page: the welcomer's card and who it was. A player who never saw it
 * gets the face-down card with no way out until it has turned, which waits for a Reveal button.
 * Only a day 14 ending leaves it unseen: a right guess celebrates in place on the card.
 */
export function FoundReveal({
  open,
  outcome,
  onClose,
  returnFocusTo,
  onExited,
  flightId,
  rotation = 0,
}: FoundRevealProps) {
  const seen = outcome.over && outcome.revealSeen;
  const startPhase: RevealPhase = seen ? "revealed" : "gate";
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
          rotation={rotation}
          onClose={onClose}
        />
      ) : null}
    </CardOverlay>
  );
}

type FoundBodyProps = Pick<FoundRevealProps, "flightId" | "rotation" | "onClose"> & {
  outcome: FoundOutcome;
  phase: RevealPhase;
  onReveal: () => void;
  onRevealed: () => void;
};

function FoundBody({
  outcome,
  phase,
  onReveal,
  onRevealed,
  flightId,
  rotation = 0,
  onClose,
}: FoundBodyProps) {
  const { found, welcomer, foundOnDay, cluesUsed } = outcome;
  const [startedRevealed] = useState(phase === "revealed");
  const [flipped, setFlipped] = useState(startedRevealed);
  const [cardScope, animateCard] = useAnimate<HTMLDivElement>();
  const reduceMotion = useReducedMotion();
  const cardRotation = flightId ? 0 : LANDED_STICKER_ROTATION;
  // After the tap's build-up the card is already still, so the words follow at once.
  const wordsAt = !startedRevealed ? 0 : flightId ? FLIGHT_S : LANDED_STICKER_DONE_AT;
  const UnrevealedTitle = phase === "revealed" ? "h2" : Dialog.Title;
  const RevealedTitle = phase === "revealed" ? Dialog.Title : "h2";

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
    const card = cardScope.current;
    if (reduceMotion) {
      setFlipped(true);
      flipLanded();
      onRevealed();
      return;
    }
    const bounds = card.getBoundingClientRect();
    const toMiddle = window.innerHeight / 2 - (bounds.top + bounds.height / 2);
    await animateCard(card, { y: toMiddle }, REVEAL_TO_MIDDLE);
    setFlipped(true);
  };

  // The turn has landed: confetti, the hold, then back up to its place.
  const settleCard = async () => {
    flipLanded();
    if (!reduceMotion) await animateCard(cardScope.current, { y: 0 }, REVEAL_BACK);
    onRevealed();
  };

  // The face-down card turns into the welcomer's, so that is the card that flies home.
  const card = (
    <motion.div ref={cardScope}>
      <Flip
        className={CARD_SIZE}
        flipped={flipped}
        onFlipped={phase === "revealing" && !reduceMotion ? settleCard : undefined}
        front={<IncognitoCard rot={cardRotation} />}
        back={
          <Sticker
            person={welcomer.person}
            mode={welcomer.mode}
            size="lg"
            rot={cardRotation}
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
        className="flex items-center justify-between border-transparent border-b px-4 pt-1 pb-2.5 md:h-18 md:px-10 md:py-0 [&>*]:pointer-events-auto"
        {...OVERLAY_FADE}
      >
        <span className="font-game-serif text-heading md:text-logo">The Album</span>
        {phase === "gate" ? (
          <CloseButton asChild tone="on-color" label="Back to album">
            <Link href={ROUTES.play} />
          </CloseButton>
        ) : phase === "revealed" ? (
          <CloseButton tone="on-color" label="Close" onClick={onClose} />
        ) : null}
      </motion.div>

      <div className="mx-auto flex w-full max-w-260 flex-col items-center gap-8 px-4 py-8 text-center md:px-8">
        {flightId ? (
          <OverlayCard flightId={flightId} rotation={rotation}>
            {card}
          </OverlayCard>
        ) : (
          <motion.div exit={OVERLAY_FADE.exit}>
            <Reveal variant="land" delay={LANDED_STICKER_AT}>
              {card}
            </Reveal>
          </motion.div>
        )}
        <motion.div
          className="pointer-events-auto grid w-full justify-items-center"
          // Cut, not faded: the page's own heading shows through the fading backdrop right where
          // these words sit, and the two read as a doubled, glitching line.
          exit={{ opacity: 0, transition: CUT }}
        >
          {/* Stays in place under the revealed words, so the card does not shift as they arrive. */}
          <motion.div
            className="col-start-1 row-start-1 flex flex-col items-center gap-8"
            // Starts where it should be: without it, an already seen reveal flashes these words.
            initial={false}
            animate={{ opacity: phase === "gate" ? 1 : 0 }}
            transition={REVEAL_WORDS}
            aria-hidden={phase !== "gate"}
            inert={phase !== "gate"}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="font-game-mono text-caption uppercase">
                {found ? "Mission complete" : "Day 14 · Time’s up"}
              </span>
              <UnrevealedTitle className="text-balance font-game-serif text-hero-md md:text-hero">
                Who was your welcomer?
              </UnrevealedTitle>
            </div>
            <GameButton onClick={revealCard}>Reveal</GameButton>
          </motion.div>
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
            <span className="font-game-mono text-caption uppercase">
              {found ? "Mission complete" : "Day 14"}
            </span>
            <RevealedTitle className="font-game-serif text-hero">
              It was {welcomer.firstName}
            </RevealedTitle>
            <p className="text-lead">
              {found
                ? foundLead(foundOnDay, cluesUsed, "ink")
                : "You were close. Now you know who to say hi to."}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
