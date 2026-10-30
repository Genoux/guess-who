import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CardEditor } from "@/features/card/components/card-editor";
import { getMyCard } from "@/features/card/queries/get-my-card";
import { AppTopNav } from "@/features/games/components/app-top-nav";
import { getTopNav } from "@/features/games/queries/get-top-nav";
import { GameShell } from "@/shared/components/game/game-shell";
import { GameStage } from "@/shared/components/game/game-stage";
import { ROUTES } from "@/shared/config/routes";

export const metadata: Metadata = { title: "My card" };

export default async function CardPage() {
  const nav = await getTopNav();
  // A new hire earns their card by playing: it opens once the mission is done.
  if (nav.locked) redirect(ROUTES.play);
  const card = await getMyCard();

  return (
    <GameShell>
      <AppTopNav nav={nav} current="card" />
      <GameStage>
        <CardEditor card={card} />
      </GameStage>
    </GameShell>
  );
}
