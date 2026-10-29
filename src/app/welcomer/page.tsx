import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WelcomerHome } from "@/features/games/components/welcomer-home";
import { getCluesDesk } from "@/features/games/queries/get-clues-desk";
import { getIsAdmin } from "@/features/games/queries/get-is-admin";
import { ROUTES } from "@/shared/config/routes";

export const metadata: Metadata = { title: "Secret welcomer" };

export default async function WelcomerPage() {
  const [desk, admin] = await Promise.all([getCluesDesk(), getIsAdmin()]);
  if (!desk.welcoming) redirect(ROUTES.card);
  return (
    <WelcomerHome
      playerFirstName={desk.playerFirstName}
      cluesSet={desk.clues.every((clue) => clue.number === 1 || clue.text)}
      admin={admin}
    />
  );
}
