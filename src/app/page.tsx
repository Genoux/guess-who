import { redirect } from "next/navigation";
import { getActivePlayerGame } from "@/features/games/queries/get-active-player-game";
import { ROUTES } from "@/shared/config/routes";
import { authorizeMember } from "@/shared/lib/auth";

export default async function HomePage() {
  // The game comes first, so an admin who is also a new hire lands on their mission.
  if (await getActivePlayerGame()) redirect(ROUTES.play);
  const viewer = await authorizeMember();
  redirect(viewer.role === "admin" ? ROUTES.admin : ROUTES.card);
}
