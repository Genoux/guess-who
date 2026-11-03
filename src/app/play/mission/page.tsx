import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppTopNav } from "@/features/games/components/app-top-nav";
import { MissionCase } from "@/features/games/components/mission-case";
import { MissionClues } from "@/features/games/components/mission-clues";
import { HERO_DEALT_S, MissionBrief } from "@/features/games/components/mission-hero";
import { getPlayerMission } from "@/features/games/queries/get-player-mission";
import { getPlayerWelcome } from "@/features/games/queries/get-player-welcome";
import { getTopNav } from "@/features/games/queries/get-top-nav";
import { GameShell } from "@/shared/components/game/game-shell";
import { GameStage } from "@/shared/components/game/game-stage";
import { ROUTES } from "@/shared/config/routes";

export const metadata: Metadata = { title: "Mission" };

export default async function MissionPage() {
  const welcome = await getPlayerWelcome();
  if (welcome && !welcome.seen) redirect(ROUTES.playWelcome);
  const [mission, nav] = await Promise.all([getPlayerMission(), getTopNav()]);
  if (!mission) redirect(ROUTES.play);

  return (
    <GameShell>
      <AppTopNav nav={nav} current="mission" />
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
