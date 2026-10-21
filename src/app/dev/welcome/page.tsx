import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WelcomeIntro } from "@/features/games/components/welcome-intro";
import { GameShell } from "@/shared/components/game/game-shell";
import { env } from "@/shared/config/env";
import { isCatalogueEnabled } from "../_lib/catalogue-access";
import { ana, jonah, noor } from "../_lib/fixtures";

export const metadata: Metadata = {
  title: "Welcome intro (dev)",
  robots: { index: false, follow: false },
};

/** The player's welcome intro with sample stickers, for local dev and previews only. */
export default function WelcomePreviewPage() {
  if (!isCatalogueEnabled({ nodeEnv: env.NODE_ENV, vercelEnv: env.NEXT_PUBLIC_VERCEL_ENV })) {
    notFound();
  }

  return (
    <GameShell>
      <WelcomeIntro
        firstName="John"
        fan={[noor, ana, jonah]}
        colors={[noor.color, ana.color]}
        preview
      />
    </GameShell>
  );
}
