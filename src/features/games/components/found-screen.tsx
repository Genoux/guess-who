"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect } from "react";
import { CloseButton } from "@/shared/components/game/close-button";
import { GameButton } from "@/shared/components/game/game-button";
import { GameStage } from "@/shared/components/game/game-stage";
import { Pop } from "@/shared/components/game/pop";
import { Sticker } from "@/shared/components/game/sticker";
import type { StickerMode, StickerPerson } from "@/shared/components/game/sticker-view";
import { ROUTES } from "@/shared/config/routes";
import { celebrate } from "@/shared/lib/celebrate";

type FoundScreenProps = {
  found: boolean;
  welcomer: { firstName: string; person: StickerPerson; mode: StickerMode };
  foundOnDay: number | null;
  cluesUsed: number | null;
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

function foundLead(day: number | null, clues: number | null) {
  if (day === null || clues === null) return "You found them.";
  const withClues = clues === 0 ? "with no clues" : `with ${plural(clues, "clue")}`;
  return `Found in ${plural(day, "day")}, ${withClues}.`;
}

/** The orange ending: the welcomer's sticker, who it was, and the way to the player's own card. */
export function FoundScreen({ found, welcomer, foundOnDay, cluesUsed }: FoundScreenProps) {
  useEffect(() => {
    const burst = (x: number) =>
      void celebrate({ x, y: 0.75 }, { kind: "found", palette: "found" });
    const first = window.setTimeout(() => {
      burst(0.15);
      burst(0.85);
    }, 600);
    const second = window.setTimeout(() => {
      burst(0.3);
      burst(0.7);
    }, 1300);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(second);
    };
  }, []);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-5 md:px-10">
        <span className="font-game-serif text-logo">The Album</span>
        <CloseButton asChild tone="on-color" label="Back to album">
          <Link href={ROUTES.play} />
        </CloseButton>
      </div>
      <GameStage middle className="gap-8 pt-0">
        <motion.div
          initial={{ opacity: 0, y: 80, rotate: -6, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.2, 0.9, 0.3, 1.2] }}
        >
          <Sticker
            person={welcomer.person}
            mode={welcomer.mode}
            size="lg"
            rot={-2}
            celebrateChanges={false}
          />
        </motion.div>
        <Pop delay={0.7} className="flex flex-col items-center gap-2">
          <span className="font-game-mono text-caption uppercase">
            {found ? "Mission complete" : "Day 14"}
          </span>
          <h1 className="font-game-serif text-hero">
            {found ? `It was ${welcomer.firstName}.` : `Time’s up. It was ${welcomer.firstName}.`}
          </h1>
          <p className="text-lead">
            {found ? foundLead(foundOnDay, cluesUsed) : "You were close. Still worth a coffee."}
          </p>
        </Pop>
        <Pop delay={0.85} className="flex flex-wrap items-center justify-center gap-4">
          <GameButton asChild>
            <Link href={ROUTES.card}>Make my card</Link>
          </GameButton>
        </Pop>
      </GameStage>
    </>
  );
}
