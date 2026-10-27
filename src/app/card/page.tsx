import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CardEditor } from "@/features/card/components/card-editor";
import { getMyCard } from "@/features/card/queries/get-my-card";
import { PlayerTopNav } from "@/features/games/components/player-top-nav";
import { getActivePlayerGame } from "@/features/games/queries/get-active-player-game";
import { getPlayerNav } from "@/features/games/queries/get-player-nav";
import { GameAvatar } from "@/shared/components/game/game-avatar";
import { GameShell } from "@/shared/components/game/game-shell";
import { GameStage } from "@/shared/components/game/game-stage";
import { GameTopNav } from "@/shared/components/game/game-top-nav";
import { ROUTES } from "@/shared/config/routes";

export const metadata: Metadata = { title: "Your sticker" };

export default async function CardPage() {
  // A new hire makes their sticker once their game ends; until then they play.
  if (await getActivePlayerGame()) redirect(ROUTES.play);
  const [card, playerNav] = await Promise.all([getMyCard(), getPlayerNav()]);
  const team = card.teams.find((option) => option.id === card.fields.teamId);

  return (
    <GameShell>
      {playerNav ? (
        <PlayerTopNav nav={playerNav} current="card" />
      ) : (
        <GameTopNav
          logoHref={ROUTES.home}
          end={<GameAvatar name={card.name} color={team?.color ?? "var(--color-game-hover)"} />}
        />
      )}
      <GameStage>
        <CardEditor card={card} />
      </GameStage>
    </GameShell>
  );
}
