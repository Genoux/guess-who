import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CluesFlow } from "@/features/games/components/clues-flow";
import { getActivePlayerGame } from "@/features/games/queries/get-active-player-game";
import { getCluesDesk } from "@/features/games/queries/get-clues-desk";
import { getIsAdmin } from "@/features/games/queries/get-is-admin";
import { ROUTES } from "@/shared/config/routes";

export const metadata: Metadata = { title: "Your secret clues" };

export default async function CluesPage() {
  // A new hire plays until their game ends; their clues wait until then.
  if (await getActivePlayerGame()) redirect(ROUTES.play);
  const [desk, admin] = await Promise.all([getCluesDesk(), getIsAdmin()]);
  return <CluesFlow desk={desk} admin={admin} />;
}
