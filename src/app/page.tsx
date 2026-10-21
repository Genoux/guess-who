import { redirect } from "next/navigation";
import { getActivePlayerGame } from "@/features/games/queries/get-active-player-game";
import { ROUTES } from "@/shared/config/routes";
import { authorizeMember } from "@/shared/lib/auth";

export default async function HomePage() {
  const viewer = await authorizeMember();
  if (viewer.role === "admin") redirect(ROUTES.admin);
  redirect((await getActivePlayerGame()) ? ROUTES.play : ROUTES.card);
}
