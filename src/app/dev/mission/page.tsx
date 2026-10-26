import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MissionClues } from "@/features/games/components/mission-clues";
import { HERO_DEALT_S, MissionHero } from "@/features/games/components/mission-hero";
import type { MissionClue } from "@/features/games/queries/get-player-mission";
import { welcomerClue } from "@/shared/components/game/fixtures";
import { GameShell } from "@/shared/components/game/game-shell";
import { GameStage } from "@/shared/components/game/game-stage";
import { env } from "@/shared/config/env";
import { isCatalogueEnabled } from "@/shared/lib/catalogue-access";

export const metadata: Metadata = {
  title: "Mission (dev)",
  robots: { index: false, follow: false },
};

const clues: MissionClue[] = [
  { number: 1, state: "open", unlocksInDays: null, text: "Works in Creative." },
  { number: 2, state: "new", unlocksInDays: null, text: welcomerClue },
  { number: 3, state: "down", unlocksInDays: 2, text: null },
  { number: 4, state: "down", unlocksInDays: 5, text: null },
];

/** The mission page on day 7 with sample clues, for local dev and previews only. */
export default function MissionPreviewPage() {
  if (!isCatalogueEnabled({ nodeEnv: env.NODE_ENV, vercelEnv: env.NEXT_PUBLIC_VERCEL_ENV })) {
    notFound();
  }

  return (
    <GameShell>
      <GameStage className="max-w-280 gap-20">
        <MissionHero />
        <MissionClues clues={clues} delay={HERO_DEALT_S} />
      </GameStage>
    </GameShell>
  );
}
