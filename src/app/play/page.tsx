import { redirect } from "next/navigation";
import { getActivePlayerGame } from "@/features/games/queries/get-active-player-game";
import { ROUTES } from "@/shared/config/routes";

export default async function PlayPage() {
  const game = await getActivePlayerGame();
  if (!game) redirect(ROUTES.card);
  return (
    <main>
      <h1>Your mission</h1>
    </main>
  );
}
