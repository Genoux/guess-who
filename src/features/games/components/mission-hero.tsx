"use client";

import Link from "next/link";
import { GameButton } from "@/shared/components/game/game-button";
import { beats } from "@/shared/components/game/game-motion";
import { Reveal } from "@/shared/components/game/reveal";
import { Sticker } from "@/shared/components/game/sticker";
import { ROUTES } from "@/shared/config/routes";
import { STICKER_FILTER_PARAM } from "../lib/sticker-filter";
import { TUTORIAL_WELCOMER } from "../lib/tutorial-cast";

/** When the hero has dealt in, for what comes below it. */
export const HERO_DEALT_S = beats(2);
const STICKER_AT = beats(1);

const WELCOMER_ROTATION = 3;
// Ink with the shortlist yellow (--color-game-ink, --color-game-shortlist), so the card reads as the
// mission, not a teammate. Sticker colors are inline styles, so the hex values repeat the tokens.
const INCOGNITO_WELCOMER = { ...TUTORIAL_WELCOMER, tint: "#191910", tintInk: "#f9d317" };
const GUESS_HREF = `${ROUTES.play}?${STICKER_FILTER_PARAM}=collected`;

/** What the mission is, and the secret welcomer's incognito card. */
export function MissionHero() {
  return (
    <section className="grid w-full items-center justify-items-center gap-12 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16">
      <Reveal
        variant="fade"
        className="flex max-w-140 flex-col items-center gap-6 text-center md:items-start md:text-left"
      >
        <div className="flex flex-col gap-3">
          <span className="font-game-mono text-caption text-game-muted uppercase">
            Misión incógnita
          </span>
          <h1 className="text-balance font-game-serif text-hero-md md:text-hero">
            Who’s your secret welcomer?
          </h1>
        </div>
        <p className="text-pretty text-game-muted text-lead">
          Someone on the team is your secret welcomer. A new clue appears every 3 days. When you
          think you know, open their card in the Album and make your guess. You can only guess
          someone once you’ve collected their sticker.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 md:justify-start">
          <GameButton asChild>
            <Link href={GUESS_HREF}>Guess who</Link>
          </GameButton>
          <GameButton asChild variant="light">
            <Link href={ROUTES.playWelcome}>How it works</Link>
          </GameButton>
        </div>
      </Reveal>

      <Reveal variant="fade" delay={STICKER_AT}>
        <Sticker person={INCOGNITO_WELCOMER} mode="locked" size="lg" rot={WELCOMER_ROTATION} />
      </Reveal>
    </section>
  );
}
