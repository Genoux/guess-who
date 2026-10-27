import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MissionCase } from "@/features/games/components/mission-case";
import { MissionClues } from "@/features/games/components/mission-clues";
import { HERO_DEALT_S, MissionBrief } from "@/features/games/components/mission-hero";
import { PlayerTopNav } from "@/features/games/components/player-top-nav";
import { getPlayerMission } from "@/features/games/queries/get-player-mission";
import { GameShell } from "@/shared/components/game/game-shell";
import { GameStage } from "@/shared/components/game/game-stage";
import { ROUTES } from "@/shared/config/routes";

export const metadata: Metadata = { title: "Mission" };

export default async function MissionPage() {
  const mission = await getPlayerMission();
  if (!mission) redirect(ROUTES.card);

  return (
    <GameShell>
      <PlayerTopNav nav={mission.nav} current="mission" />
      <GameStage className="max-w-280 gap-12">
        {mission.outcome.over ? (
          <MissionCase outcome={mission.outcome} clues={mission.clues} />
        ) : (
          <>
            <MissionBrief />
            <MissionClues clues={mission.clues} delay={HERO_DEALT_S} />
          </>
        )}
      </GameStage>
    </GameShell>
  );
}
