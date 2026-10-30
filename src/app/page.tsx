import { redirect } from "next/navigation";
import { getMissionState } from "@/features/games/queries/get-mission-state";
import { getPlayerWelcome } from "@/features/games/queries/get-player-welcome";
import { getTopNav } from "@/features/games/queries/get-top-nav";
import { ROUTES } from "@/shared/config/routes";
import { authorizeMember } from "@/shared/lib/auth";

export default async function HomePage() {
  // The mission comes first, so an admin who is also on one lands on it.
  const mission = await getMissionState();
  if (mission === "playing") {
    redirect((await getPlayerWelcome())?.seen ? ROUTES.play : ROUTES.playWelcome);
  }
  // A new hire with no mission lands on the screen that says it will open soon.
  if ((await getTopNav()).locked) redirect(ROUTES.play);
  const viewer = await authorizeMember();
  redirect(viewer.role === "admin" ? ROUTES.admin : ROUTES.card);
}
