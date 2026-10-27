"use client";

import { motion } from "motion/react";
import { useRef, useState } from "react";
import { ClueCard } from "@/shared/components/game/clue-card";
import { Flip } from "@/shared/components/game/flip";
import { GameButton } from "@/shared/components/game/game-button";
import { gameCn } from "@/shared/components/game/game-cn";
import { stagger, TRANSITION } from "@/shared/components/game/game-motion";
import { gameToast } from "@/shared/components/game/game-toaster";
import { Reveal } from "@/shared/components/game/reveal";
import { Tilt } from "@/shared/components/game/tilt";
import { celebrate, originFromElement } from "@/shared/lib/celebrate";
import { markClueRead } from "../actions/mark-clue-read";
import { clueUnlockCopy } from "../lib/game-clues";
import type { MissionClue } from "../queries/get-player-mission";

const ROTATIONS = [-3, 1.5, -1, 2.5];

type MissionCluesProps = {
  clues: MissionClue[];
  /** Seconds before the first card deals in, after what comes above it. */
  delay?: number;
};

/**
 * The four clues: two staggered columns on a phone, then a row. Only a turned-over clue lies at an angle and tilts on hover; a clue
 * not out yet and a released one waiting face down sit straight, the face-down one with a button
 * to turn it over where it sits.
 */
export function MissionClues({ clues, delay = 0 }: MissionCluesProps) {
  return (
    // Every clue card is 200 × 260 at every width, never scaled. Four in a row once they fit
    // (57rem), two staggered columns once two fit (28rem), else one column offset left and right.
    <ul
      aria-label="Clues"
      className="grid grid-cols-[12.5rem] justify-center gap-x-4 gap-y-6 min-[28rem]:grid-cols-[repeat(2,12.5rem)] min-[28rem]:pb-12 min-[57rem]:grid-cols-[repeat(4,12.5rem)] min-[57rem]:pb-0 lg:gap-x-6"
    >
      {clues.map((clue, index) => (
        <Reveal
          key={clue.number}
          as="li"
          variant="fade"
          className="flex justify-center max-[28rem]:odd:-translate-x-4 max-[28rem]:even:translate-x-4 min-[28rem]:max-[57rem]:even:translate-y-12"
          delay={delay + stagger(index, clues.length)}
        >
          <MissionClueCard clue={clue} />
        </Reveal>
      ))}
    </ul>
  );
}

function MissionClueCard({ clue }: { clue: MissionClue }) {
  if (clue.state === "down") {
    return (
      <ClueCard
        state="locked"
        label={`Clue ${clue.number}`}
        footer={clueUnlockCopy(clue.unlocksInDays ?? 0)}
        className="w-full"
      />
    );
  }

  return (
    <ClueReveal
      number={clue.number}
      text={clue.text ?? undefined}
      open={clue.state === "open"}
      onReveal={() =>
        void markClueRead({ number: clue.number as 1 | 2 | 3 | 4 }).then((result) => {
          if (!result.ok) gameToast(result.error);
        })
      }
    />
  );
}

type ClueRevealProps = {
  number: number;
  /** Unknown while face down: the server sends it once the clue is read. */
  text?: string;
  /** Already read, so it lies face up. */
  open: boolean;
  onReveal?: () => void;
  className?: string;
};

/** A released clue: face down with a Reveal button, then at its angle, with confetti as it lands. */
export function ClueReveal({ number, text, open, onReveal, className }: ClueRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const label = `Clue ${number}`;
  const faceUp = open || revealed;

  return (
    <Tilt className={gameCn("h-65 w-full", className)} disabled={!faceUp}>
      <motion.div
        ref={cardRef}
        className="size-full"
        initial={false}
        animate={{ rotate: faceUp ? (ROTATIONS[number - 1] ?? 0) : 0 }}
        transition={TRANSITION.arrive}
      >
        <Flip
          className="size-full"
          flipped={faceUp}
          onFlipped={() => {
            if (cardRef.current) void celebrate(originFromElement(cardRef.current));
          }}
          front={
            <ClueCard
              state="down"
              label={label}
              footer={
                <GameButton
                  size="sm"
                  variant="yellow"
                  onClick={() => {
                    setRevealed(true);
                    onReveal?.();
                  }}
                >
                  Reveal
                </GameButton>
              }
              className="size-full"
            />
          }
          back={<ClueCard state="up" label={label} text={text} className="size-full" />}
        />
      </motion.div>
    </Tilt>
  );
}
