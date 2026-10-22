import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FoundScreen } from "@/features/games/components/found-screen";
import { getGameOutcome } from "@/features/games/queries/get-game-outcome";
import { GameShell } from "@/shared/components/game/game-shell";
import { ROUTES } from "@/shared/config/routes";

export const metadata: Metadata = { title: "Found" };

export default async function FoundPage() {
  const outcome = await getGameOutcome();
  if (!outcome) redirect(ROUTES.card);
  if (!outcome.over) redirect(ROUTES.playMission);

  return (
    <GameShell tone="found">
      <FoundScreen
        found={outcome.found}
        welcomer={outcome.welcomer}
        foundOnDay={outcome.foundOnDay}
        cluesUsed={outcome.cluesUsed}
      />
    </GameShell>
  );
}
