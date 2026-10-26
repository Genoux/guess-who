"use client";

import { motion } from "motion/react";
import { useRef, useState } from "react";
import { ClueCard } from "@/shared/components/game/clue-card";
import { Flip } from "@/shared/components/game/flip";
import { GameButton } from "@/shared/components/game/game-button";
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
 * The four clues in a row. Only a turned-over clue lies at an angle and tilts on hover; a clue
 * not out yet and a released one waiting face down sit straight, the face-down one with a button
 * to turn it over where it sits.
 */
export function MissionClues({ clues, delay = 0 }: MissionCluesProps) {
  return (
    <ul
      aria-label="Clues"
      className="grid w-full grid-cols-[repeat(2,minmax(0,12.5rem))] justify-center gap-x-4 gap-y-6 sm:gap-x-6 md:grid-cols-[repeat(4,12.5rem)]"
    >
      {clues.map((clue, index) => (
        <Reveal
          key={clue.number}
          as="li"
          variant="fade"
          className="flex w-full justify-center"
          delay={delay + stagger(index, clues.length)}
        >
          <MissionClueCard clue={clue} rotation={ROTATIONS[index] ?? 0} />
        </Reveal>
      ))}
    </ul>
  );
}

function MissionClueCard({ clue, rotation }: { clue: MissionClue; rotation: number }) {
  const [revealed, setRevealed] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const locked = clue.state === "down";
  const label = `Clue ${clue.number}`;

  const reveal = () => {
    setRevealed(true);
    setCelebrating(true);
    void markClueRead({ number: clue.number as 1 | 2 | 3 | 4 }).then((result) => {
      if (!result.ok) gameToast(result.error);
    });
  };

  if (locked) {
    return (
      <ClueCard
        state="locked"
        label={label}
        footer={clueUnlockCopy(clue.unlocksInDays ?? 0)}
        className="w-full"
      />
    );
  }

  const faceUp = clue.state === "open" || revealed;

  return (
    <Tilt className="h-65 w-full" disabled={!faceUp}>
      <motion.div
        ref={cardRef}
        className="size-full"
        initial={false}
        animate={{ rotate: faceUp ? rotation : 0 }}
        transition={TRANSITION.arrive}
      >
        <Flip
          className="size-full"
          flipped={faceUp}
          onFlipped={() => {
            if (!celebrating || !cardRef.current) return;
            setCelebrating(false);
            void celebrate(originFromElement(cardRef.current));
          }}
          front={
            <ClueCard
              state="down"
              label={label}
              footer={
                <GameButton size="sm" variant="yellow" onClick={reveal}>
                  Reveal
                </GameButton>
              }
              className="size-full"
            />
          }
          back={
            <ClueCard
              state="up"
              label={label}
              text={clue.text ?? undefined}
              className="size-full"
            />
          }
        />
      </motion.div>
    </Tilt>
  );
}
