import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CluesFlow } from "@/features/games/components/clues-flow";
import { getCluesDesk } from "@/features/games/queries/get-clues-desk";
import { getTopNav } from "@/features/games/queries/get-top-nav";
import { ROUTES } from "@/shared/config/routes";

export const metadata: Metadata = { title: "My clues" };

export default async function CluesPage() {
  const nav = await getTopNav();
  // A new hire earns their clues by playing: they open once the mission is done.
  if (nav.locked) redirect(ROUTES.play);
  const desk = await getCluesDesk();
  return <CluesFlow desk={desk} nav={nav} />;
}
