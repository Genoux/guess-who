import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MissionClues } from "@/features/games/components/mission-clues";
import { MissionSuspects } from "@/features/games/components/mission-suspects";
import { PlayerTopNav } from "@/features/games/components/player-top-nav";
import { getPlayerMission } from "@/features/games/queries/get-player-mission";
import { CountChip } from "@/shared/components/game/count-chip";
import { GameBook } from "@/shared/components/game/game-book";
import { GameShell } from "@/shared/components/game/game-shell";
import { GameStage } from "@/shared/components/game/game-stage";
import { ROUTES } from "@/shared/config/routes";

export const metadata: Metadata = { title: "Mission" };

export default async function MissionPage() {
  const mission = await getPlayerMission();
  if (!mission) redirect(ROUTES.card);
  if (!mission.active) redirect(ROUTES.playFound);

  return (
    <GameShell>
      <PlayerTopNav nav={mission.nav} current="mission" />
      <GameStage>
        <div className="flex flex-col items-center gap-4">
          <h1 className="font-game-serif text-hero">Who’s your welcomer?</h1>
          <CountChip variant="dark">
            {mission.daysLeft === 1 ? "1 day left" : `${mission.daysLeft} days left`}
          </CountChip>
        </div>

        <MissionClues clues={mission.clues} nextClue={mission.nextClue} />

        <GameBook className="max-w-180 gap-8 px-8 py-10">
          <div className="flex flex-col items-center gap-1">
            <h2 className="font-game-serif text-title">Your maybes</h2>
            <p className="text-game-muted">Guess when you’re sure.</p>
          </div>
          <MissionSuspects maybes={mission.maybes} nextClue={mission.nextClue} />
          {mission.ruledOut.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <span className="text-game-muted text-small">Not them</span>
              {mission.ruledOut.map((person) => (
                <CountChip key={person.id} size="sm" dotColor={person.color}>
                  {person.name}
                </CountChip>
              ))}
            </div>
          ) : null}
        </GameBook>
      </GameStage>
    </GameShell>
  );
}
