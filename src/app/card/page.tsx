import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CardEditor } from "@/features/card/components/card-editor";
import { getMyCard } from "@/features/card/queries/get-my-card";
import { PlayerTopNav } from "@/features/games/components/player-top-nav";
import { TeammateTopNav } from "@/features/games/components/teammate-top-nav";
import { getActivePlayerGame } from "@/features/games/queries/get-active-player-game";
import { getIsWelcomer } from "@/features/games/queries/get-is-welcomer";
import { getPlayerNav } from "@/features/games/queries/get-player-nav";
import { GameShell } from "@/shared/components/game/game-shell";
import { GameStage } from "@/shared/components/game/game-stage";
import { ROUTES } from "@/shared/config/routes";

export const metadata: Metadata = { title: "Your sticker" };

export default async function CardPage() {
  // A new hire makes their sticker once their game ends; until then they play.
  if (await getActivePlayerGame()) redirect(ROUTES.play);
  const [card, playerNav, welcomer] = await Promise.all([
    getMyCard(),
    getPlayerNav(),
    getIsWelcomer(),
  ]);

  return (
    <GameShell>
      {playerNav ? (
        <PlayerTopNav nav={playerNav} current="card" />
      ) : (
        <TeammateTopNav current="card" welcomer={welcomer} />
      )}
      <GameStage>
        <CardEditor card={card} />
      </GameStage>
    </GameShell>
  );
}
