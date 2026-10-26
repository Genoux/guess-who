import Link from "next/link";
import { AccountButton } from "@/shared/components/account-button";
import { CountChip } from "@/shared/components/game/count-chip";
import { GameTopNav } from "@/shared/components/game/game-top-nav";
import { IconButton } from "@/shared/components/game/icon-button";
import { PillTabs } from "@/shared/components/game/pill-tabs";
import { ROUTES } from "@/shared/config/routes";
import type { PlayerNav } from "../server/load-player-board";

type PlayerTopNavProps = {
  nav: PlayerNav;
  current: "album" | "mission" | "card";
};

/**
 * Album and Mission tabs, plus My card once the game is over, a way back to the intro, the
 * sticker count and the account menu.
 */
export function PlayerTopNav({ nav, current }: PlayerTopNavProps) {
  const album = { href: ROUTES.play, label: "Album", current: current === "album" };
  const mission = {
    href: ROUTES.playMission,
    label: "Mission",
    current: current === "mission",
    badge: nav.hasNewClue ? "New clue" : undefined,
  };
  const card = { href: ROUTES.card, label: "My card", current: current === "card" };

  return (
    <GameTopNav
      logoHref={ROUTES.play}
      tabs={<PillTabs tabs={nav.over ? [album, mission, card] : [album, mission]} />}
      end={
        <>
          <IconButton
            asChild
            label="How it works"
            icon={<span className="font-medium text-small">?</span>}
            tone="outline"
            size="xs"
          >
            <Link href={ROUTES.playWelcome} />
          </IconButton>
          <CountChip>
            <span className="sr-only">Stickers collected: </span>
            {nav.collectedCount} / {nav.total}
          </CountChip>
          <AccountButton />
        </>
      }
    />
  );
}
