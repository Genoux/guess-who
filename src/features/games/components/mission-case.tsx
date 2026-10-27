"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { gameCn } from "@/shared/components/game/game-cn";
import { Sticker } from "@/shared/components/game/sticker";
import { FLIGHT } from "../lib/album-motion";
import { endingEyebrow } from "../lib/ending-eyebrow";
import type { MissionClue } from "../queries/get-player-mission";
import type { GameOutcome } from "../server/to-game-outcome";
import { foundLead } from "./found-lead";
import { FoundReveal } from "./found-reveal";
import { MissionClues } from "./mission-clues";
import { HERO_DEALT_S, MissionHero } from "./mission-hero";

const WELCOMER_FLIGHT_ID = "mission-welcomer";
const WELCOMER_CARD = `[data-card-id="${WELCOMER_FLIGHT_ID}"]`;

type MissionCaseProps = {
  outcome: Extract<GameOutcome, { over: true }>;
  clues: MissionClue[];
};

/** The finished mission: the playing layout, with the welcomer's card where the incognito one stood. */
export function MissionCase({ outcome, clues }: MissionCaseProps) {
  const { found, welcomer } = outcome;
  // Time's up opens on arrival until the reveal has been seen; the page under it holds the
  // spoiler. A find was revealed by the guess itself, so its page opens as it is.
  const revealPending = !found && !outcome.revealSeen;
  const [revealOpen, setRevealOpen] = useState(revealPending);
  const [wasPending, setWasPending] = useState(revealPending);
  // The dev panel can mark it unseen again, which replays the reveal.
  if (revealPending !== wasPending) {
    setWasPending(revealPending);
    if (revealPending) setRevealOpen(true);
  }
  const spoilerHidden = revealOpen && revealPending;
  // The card that just closed flies home above the backdrop, so its slot must paint on top.
  const [returning, setReturning] = useState(false);

  const card = (
    <Sticker person={welcomer.person} mode={welcomer.mode} size="lg" celebrateChanges={false} />
  );

  return (
    <section
      // Opacity, not visibility: the clue cards' Flip faces set visibility inline and would show
      // through, e.g. in the page transition's snapshot when the gate's X goes to the album.
      className={gameCn("flex w-full flex-col items-center gap-12", spoilerHidden && "opacity-0")}
      inert={spoilerHidden}
    >
      <MissionHero
        eyebrow={endingEyebrow(outcome)}
        title={
          <>
            {found ? "You found" : "It was"}{" "}
            <span className="text-game-found">{welcomer.firstName}</span>
          </>
        }
        card={
          <div className="relative" style={returning ? { zIndex: 60 } : undefined}>
            {revealOpen ? (
              // Holds the slot open while the card is out; opacity, not visibility, as in the album.
              <div aria-hidden className="pointer-events-none opacity-0">
                {card}
              </div>
            ) : (
              <button
                type="button"
                data-card-id={WELCOMER_FLIGHT_ID}
                aria-label={`${welcomer.firstName}, your welcomer`}
                aria-haspopup="dialog"
                onClick={() => {
                  setRevealOpen(true);
                }}
                className="block cursor-pointer rounded-card outline-none focus-visible:outline-2 focus-visible:outline-game-found focus-visible:outline-offset-6"
              >
                <motion.div
                  layoutId={WELCOMER_FLIGHT_ID}
                  layoutCrossfade={false}
                  transition={{ layout: FLIGHT }}
                >
                  {card}
                </motion.div>
              </button>
            )}
          </div>
        }
      >
        {found ? (
          <>
            {foundLead(outcome.foundOnDay, outcome.cluesUsed)} {welcomer.firstName} was your secret
            welcomer all along.
          </>
        ) : (
          <>Time ran out, so here’s the answer: {welcomer.firstName} was your secret welcomer.</>
        )}{" "}
        Look back at the clues that pointed to them, then make your own sticker and join the album.
      </MissionHero>

      <MissionClues clues={clues} delay={HERO_DEALT_S} />

      <FoundReveal
        open={revealOpen}
        outcome={outcome}
        flightId={WELCOMER_FLIGHT_ID}
        returnFocusTo={WELCOMER_CARD}
        onClose={() => {
          setRevealOpen(false);
          setReturning(true);
        }}
        onExited={() => setReturning(false)}
      />
    </section>
  );
}
