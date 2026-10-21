import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WelcomeIntro } from "@/features/games/components/welcome-intro";
import { getPlayerWelcome } from "@/features/games/queries/get-player-welcome";
import { GameShell } from "@/shared/components/game/game-shell";
import { ROUTES } from "@/shared/config/routes";

export const metadata: Metadata = { title: "Welcome" };

export default async function WelcomePage() {
  const welcome = await getPlayerWelcome();
  if (!welcome) redirect(ROUTES.card);

  return (
    <GameShell>
      <WelcomeIntro firstName={welcome.firstName} />
    </GameShell>
  );
}
