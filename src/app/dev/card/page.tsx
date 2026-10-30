import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TEAM_DEFINITIONS } from "@/entities/teams";
import { CardEditor } from "@/features/card/components/card-editor";
import type { MyCard } from "@/features/card/types";
import { AppTopNav } from "@/features/games/components/app-top-nav";
import { DEV_TOP_NAV } from "@/features/games/lib/dev-state";
import { GameShell } from "@/shared/components/game/game-shell";
import { GameStage } from "@/shared/components/game/game-stage";
import { env } from "@/shared/config/env";
import { isCatalogueEnabled } from "@/shared/lib/catalogue-access";

export const metadata: Metadata = {
  title: "My card (dev)",
  robots: { index: false, follow: false },
};

const CARD: MyCard = {
  name: "Sam Rivera",
  stickerNumber: 12,
  imageUrl: null,
  audience: "teammate",
  fields: { teamId: "", location: "", fact: "", ask: "" },
  teams: TEAM_DEFINITIONS.map(({ name, color, tint }, index) => ({
    id: `00000000-0000-4000-8000-00000000000${index + 1}`,
    name,
    color,
    tint,
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
      <AppTopNav nav={DEV_TOP_NAV} current="card" />
      <GameStage>
        <CardEditor card={CARD} preview />
      </GameStage>
    </GameShell>
  );
}
