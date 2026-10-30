import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WelcomerHome } from "@/features/games/components/welcomer-home";
import { getCluesDesk } from "@/features/games/queries/get-clues-desk";
import { getTopNav } from "@/features/games/queries/get-top-nav";
import { ROUTES } from "@/shared/config/routes";

export const metadata: Metadata = { title: "Welcomer" };

export default async function WelcomerPage() {
  const [desk, nav] = await Promise.all([getCluesDesk(), getTopNav()]);
  if (!desk.welcoming) redirect(ROUTES.card);
  return (
    <WelcomerHome
      playerFirstName={desk.playerFirstName}
      cluesSet={desk.clues.every((clue) => clue.number === 1 || clue.text)}
      nav={nav}
    />
  );
}
