"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { GameButton } from "@/shared/components/game/game-button";
import { beats } from "@/shared/components/game/game-motion";
import { Reveal } from "@/shared/components/game/reveal";
import { ROUTES } from "@/shared/config/routes";
import { STICKER_FILTER_PARAM } from "../lib/sticker-filter";
import { IncognitoCard } from "./incognito-card";

/** When the hero has dealt in, for what comes below it. */
export const HERO_DEALT_S = beats(2);
const CARD_AT = beats(1);

const WELCOMER_ROTATION = 3;
const GUESS_HREF = `${ROUTES.play}?${STICKER_FILTER_PARAM}=collected`;

type MissionHeroProps = {
  eyebrow: string;
  title: ReactNode;
  /** The paragraph under the title. */
  children: ReactNode;
  actions?: ReactNode;
  card: ReactNode;
};

/** The mission's text on the left and the welcomer's card on the right, centered as one group. */
export function MissionHero({ eyebrow, title, children, actions, card }: MissionHeroProps) {
  return (
    <section className="grid w-full items-center justify-items-center gap-12 md:grid-cols-[minmax(0,30rem)_auto] md:justify-center md:gap-16">
      <Reveal
        variant="fade"
        className="flex flex-col items-center gap-6 text-center md:items-start md:text-left"
      >
        <div className="flex flex-col gap-3">
          <span className="font-game-mono text-caption text-game-muted uppercase">{eyebrow}</span>
          <h1 className="text-balance font-game-serif text-hero-md md:text-hero">{title}</h1>
        </div>
        <p className="text-pretty text-game-muted text-lead">{children}</p>
        {actions ? (
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 md:justify-start">
            {actions}
          </div>
        ) : null}
      </Reveal>

      {/* The lg card plus its tilt is wider than a 320px screen's stage; it scales instead of
          sliding off the edge. */}
      <Reveal variant="fade" delay={CARD_AT} className="max-[22.5rem]:scale-90">
        {card}
      </Reveal>
    </section>
  );
}

/** The mission while it runs: what it is, and the secret welcomer's incognito card. */
export function MissionBrief() {
  return (
    <MissionHero
      eyebrow="Misión incógnita"
      title="Who’s your secret welcomer?"
      card={<IncognitoCard rot={WELCOMER_ROTATION} />}
      actions={
        <>
          <GameButton asChild size="lg">
            <Link href={GUESS_HREF}>Guess who</Link>
          </GameButton>
          <GameButton asChild variant="light" size="lg">
            <Link href={ROUTES.playWelcome}>How it works</Link>
          </GameButton>
        </>
      }
    >
      Someone on the team is your secret welcomer. A new clue appears every 3 days. When you think
      you know, open their card in the Album and make your guess. You can only guess someone once
      you’ve collected their sticker.
    </MissionHero>
  );
}
