import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MissionCase } from "@/features/games/components/mission-case";
import { MissionClues } from "@/features/games/components/mission-clues";
import { HERO_DEALT_S, MissionBrief } from "@/features/games/components/mission-hero";
import type { MissionClue } from "@/features/games/queries/get-player-mission";
import type { GameOutcome } from "@/features/games/server/to-game-outcome";
import { ana, welcomerClue } from "@/shared/components/game/fixtures";
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

const welcomer = { firstName: "Ana", person: ana } as const;

// Marking the reveal seen fails without a game here, so every visit plays it again.
const ENDINGS = {
  "times-up": {
    over: true,
    found: false,
    welcomer: { ...welcomer, mode: "collected" },
    foundOnDay: null,
    cluesUsed: null,
    revealSeen: false,
  },
  found: {
    over: true,
    found: true,
    welcomer: { ...welcomer, mode: "found" },
    foundOnDay: 10,
    cluesUsed: 3,
    revealSeen: true,
  },
} satisfies Record<string, GameOutcome>;

const isEnding = (value: unknown): value is keyof typeof ENDINGS =>
  typeof value === "string" && Object.hasOwn(ENDINGS, value);

/**
 * The mission page on day 7 with sample clues, for local dev and previews only. `?ending=times-up`
 * or `?ending=found` shows the finished mission instead, the day 14 reveal included.
 */
export default async function MissionPreviewPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isCatalogueEnabled({ nodeEnv: env.NODE_ENV, vercelEnv: env.NEXT_PUBLIC_VERCEL_ENV })) {
    notFound();
  }
  const { ending } = await props.searchParams;

  return (
    <GameShell>
      <GameStage className="max-w-280 gap-12">
        {isEnding(ending) ? (
          <MissionCase outcome={ENDINGS[ending]} clues={clues} />
        ) : (
          <>
            <MissionBrief />
            <MissionClues clues={clues} delay={HERO_DEALT_S} />
          </>
        )}
      </GameStage>
    </GameShell>
  );
}
