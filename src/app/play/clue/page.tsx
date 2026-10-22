import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ClueReveal } from "@/features/games/components/clue-reveal";
import { getClueReveal } from "@/features/games/queries/get-clue-reveal";
import { GameShell } from "@/shared/components/game/game-shell";
import { ROUTES } from "@/shared/config/routes";

export const metadata: Metadata = { title: "A clue lands" };

export default async function CluePage() {
  const clue = await getClueReveal();
  if (!clue) redirect(ROUTES.playMission);

  return (
    <GameShell tone="ink">
      <ClueReveal clue={clue} />
    </GameShell>
  );
}
