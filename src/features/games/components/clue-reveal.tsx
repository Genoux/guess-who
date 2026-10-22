"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useRef, useState } from "react";
import { CloseButton } from "@/shared/components/game/close-button";
import { ClueCard } from "@/shared/components/game/clue-card";
import { Flip } from "@/shared/components/game/flip";
import { GameButton } from "@/shared/components/game/game-button";
import { GameStage } from "@/shared/components/game/game-stage";
import { gameToast } from "@/shared/components/game/game-toaster";
import { Pop } from "@/shared/components/game/pop";
import { Stepper } from "@/shared/components/game/stepper";
import { ROUTES } from "@/shared/config/routes";
import { celebrate, originFromElement } from "@/shared/lib/celebrate";
import { markClueRead } from "../actions/mark-clue-read";
import type { ClueReveal as ClueRevealData } from "../queries/get-clue-reveal";

/** The dark moment a clue lands: tap the face-down card, it flips and the player reads it. */
export function ClueReveal({ clue }: { clue: ClueRevealData }) {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const landed = () => {
    if (cardRef.current) void celebrate(originFromElement(cardRef.current), { palette: "dark" });
  };

  const flip = () => {
    if (open) return;
    setOpen(true);
    void markClueRead({ number: clue.number as 1 | 2 | 3 | 4 }).then((result) => {
      if (!result.ok) gameToast(result.error);
    });
  };

  return (
    <>
      <div className="flex justify-end px-4 py-5 md:px-10">
        <CloseButton asChild tone="dark" label="Close">
          <Link href={ROUTES.play} />
        </CloseButton>
      </div>
      <GameStage middle className="gap-8 pt-0">
        <span className="font-game-mono text-caption text-game-shortlist uppercase">
          Clue {clue.number} of 4
        </span>

        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: 60, rotate: -8 }}
          animate={{ opacity: 1, y: 0, rotate: -2 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <button
            type="button"
            onClick={flip}
            aria-label={open ? `Clue ${clue.number}: ${clue.text}` : "Flip the clue"}
            className="block cursor-pointer rounded-card-lg outline-none focus-visible:outline-2 focus-visible:outline-game-shortlist focus-visible:outline-offset-6"
          >
            <Flip
              className="h-105 w-80 max-w-[calc(100vw-32px)]"
              flipped={open}
              onFlipped={landed}
              front={
                <ClueCard
                  state="down"
                  size="lg"
                  label="Tap to flip"
                  className="size-full max-w-full gap-4 bg-game-ink-soft shadow-[6px_6px_0_var(--color-game-shortlist)]"
                />
              }
              back={
                <ClueCard
                  state="new"
                  size="lg"
                  label={`Clue ${clue.number}`}
                  text={clue.text}
                  footer={clue.generated ? "Their team" : "From your welcomer"}
                  className="size-full max-w-full shadow-[6px_6px_0_white]"
                />
              }
            />
          </button>
        </motion.div>

        <Stepper
          count={4}
          current={clue.releasedCount}
          tone="dark"
          cumulative
          label={`${clue.releasedCount} of 4 clues`}
        />

        <div className="flex min-h-13 flex-wrap items-center justify-center gap-4">
          {open ? (
            <Pop delay={0.45} className="flex flex-wrap items-center justify-center gap-4">
              <GameButton asChild variant="yellow">
                <Link href={ROUTES.play}>Find who fits</Link>
              </GameButton>
              <GameButton
                asChild
                variant="link"
                className="text-game-border-strong hover:text-white"
              >
                <Link href={ROUTES.playMission}>All clues</Link>
              </GameButton>
            </Pop>
          ) : null}
        </div>
      </GameStage>
    </>
  );
}
