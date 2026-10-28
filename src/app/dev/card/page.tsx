import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CardEditor } from "@/features/card/components/card-editor";
import type { MyCard } from "@/features/card/types";
import { TeammateTopNav } from "@/features/games/components/teammate-top-nav";
import { TEAMS } from "@/shared/components/game/fixtures";
import { GameShell } from "@/shared/components/game/game-shell";
import { GameStage } from "@/shared/components/game/game-stage";
import { env } from "@/shared/config/env";
import { isCatalogueEnabled } from "@/shared/lib/catalogue-access";

export const metadata: Metadata = {
  title: "Your sticker (dev)",
  robots: { index: false, follow: false },
};

const CARD: MyCard = {
  name: "Sam Rivera",
  stickerNumber: 12,
  audience: "teammate",
  fields: { teamId: "", location: "", fact: "", ask: "" },
  teams: Object.entries(TEAMS).map(([name, colors], index) => ({
    id: `00000000-0000-4000-8000-00000000000${index + 1}`,
    name,
    ...colors,
  })),
};

/**
 * A teammate's first visit to their card, for local dev and previews only. Saving is not stored,
 * so the editor goes on to its saved view and every visit starts empty again.
 */
export default function CardPreviewPage() {
  if (!isCatalogueEnabled({ nodeEnv: env.NODE_ENV, vercelEnv: env.NEXT_PUBLIC_VERCEL_ENV })) {
    notFound();
  }

  return (
    <GameShell>
      <TeammateTopNav current="card" welcomer={false} />
      <GameStage>
        <CardEditor card={CARD} preview />
      </GameStage>
    </GameShell>
  );
}
