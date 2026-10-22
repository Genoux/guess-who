import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WelcomerFlow } from "@/features/games/components/welcomer-flow";
import { getWelcomerDesk } from "@/features/games/queries/get-welcomer-desk";
import { ROUTES } from "@/shared/config/routes";

export const metadata: Metadata = { title: "Secret welcomer" };

export default async function WelcomerPage() {
  const desk = await getWelcomerDesk();
  if (!desk) redirect(ROUTES.card);
  return <WelcomerFlow desk={desk} />;
}
