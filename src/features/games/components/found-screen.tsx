"use client";

import Link from "next/link";
import { CloseButton } from "@/shared/components/game/close-button";
import { GameButton } from "@/shared/components/game/game-button";
import { beats, TRANSITION } from "@/shared/components/game/game-motion";
import { GameStage } from "@/shared/components/game/game-stage";
import { Reveal } from "@/shared/components/game/reveal";
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

const STICKER_AT = beats(1);
const WORDS_AT = STICKER_AT + TRANSITION.land.duration;
const ACTIONS_AT = WORDS_AT + beats(1);
const SECOND_WAVE_MS = beats(1) * 1000;

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

function foundLead(day: number | null, clues: number | null) {
  if (day === null || clues === null) return "You found them.";
  const withClues = clues === 0 ? "with no clues" : `with ${plural(clues, "clue")}`;
  return `Found in ${plural(day, "day")}, ${withClues}.`;
}

/** The orange ending: the welcomer's sticker, who it was, and the way to the player's own card. */
export function FoundScreen({ found, welcomer, foundOnDay, cluesUsed }: FoundScreenProps) {
  // Confetti waits until the last words have settled, so nothing moves under it: two waves a beat apart.
  const burst = (left: number, right: number) => {
    for (const x of [left, right])
      void celebrate({ x, y: 0.75 }, { kind: "found", palette: "found" });
  };
  const celebrateFind = () => {
    burst(0.15, 0.85);
    setTimeout(() => burst(0.3, 0.7), SECOND_WAVE_MS);
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 py-5 md:px-10">
        <span className="font-game-serif text-logo">The Album</span>
        <CloseButton asChild tone="on-color" label="Back to album">
          <Link href={ROUTES.play} />
        </CloseButton>
      </div>
      <GameStage middle className="gap-8 pt-0">
        <Reveal variant="land" delay={STICKER_AT}>
          <Sticker
            person={welcomer.person}
            mode={welcomer.mode}
            size="lg"
            rot={-2}
            celebrateChanges={false}
          />
        </Reveal>
        <Reveal delay={WORDS_AT} className="flex flex-col items-center gap-2">
          <span className="font-game-mono text-caption uppercase">
            {found ? "Mission complete" : "Day 14"}
          </span>
          <h1 className="font-game-serif text-hero">
            {found ? `It was ${welcomer.firstName}.` : `Time’s up. It was ${welcomer.firstName}.`}
          </h1>
          <p className="text-lead">
            {found
              ? foundLead(foundOnDay, cluesUsed)
              : "You were close. Now you know who to say hi to."}
          </p>
        </Reveal>
        <Reveal
          delay={ACTIONS_AT}
          onShown={celebrateFind}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <GameButton asChild>
            <Link href={ROUTES.card}>Make my card</Link>
          </GameButton>
        </Reveal>
      </GameStage>
    </>
  );
}
