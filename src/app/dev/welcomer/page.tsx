import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WelcomerFlow } from "@/features/games/components/welcomer-flow";
import type { WelcomerDesk } from "@/features/games/queries/get-welcomer-desk";
import { env } from "@/shared/config/env";
import { isCatalogueEnabled } from "@/shared/lib/catalogue-access";

export const metadata: Metadata = {
  title: "Secret welcomer (dev)",
  robots: { index: false, follow: false },
};

const DESK: WelcomerDesk = {
  playerFirstName: "Léa",
  status: "active",
  clues: [
    { number: 1, text: "Works in Strategy.", editable: false },
    { number: 2, text: null, editable: true },
    { number: 3, text: null, editable: true },
    { number: 4, text: null, editable: true },
  ],
};

/** The welcomer's pick and clue writer with sample clues, for local dev and previews only. */
export default function WelcomerPreviewPage() {
  if (!isCatalogueEnabled({ nodeEnv: env.NODE_ENV, vercelEnv: env.NEXT_PUBLIC_VERCEL_ENV })) {
    notFound();
  }

  return <WelcomerFlow desk={DESK} preview />;
}
