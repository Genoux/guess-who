import { AccountButton } from "@/shared/components/account-button";
import { CountChip } from "@/shared/components/game/count-chip";
import { GameTopNav } from "@/shared/components/game/game-top-nav";
import { PillTabs } from "@/shared/components/game/pill-tabs";
import { ROUTES } from "@/shared/config/routes";
import type { PlayerNav } from "../server/load-player-board";

type PlayerTopNavProps = {
  nav: PlayerNav;
  current: "album" | "mission";
};

/** Album and Mission tabs, the sticker count and the account menu. */
export function PlayerTopNav({ nav, current }: PlayerTopNavProps) {
  return (
    <GameTopNav
      logoHref={ROUTES.play}
      tabs={
        <PillTabs
          tabs={[
            { href: ROUTES.play, label: "Album", current: current === "album" },
            {
              href: ROUTES.playMission,
              label: "Mission",
              current: current === "mission",
              badge: nav.hasNewClue ? "New clue" : undefined,
            },
          ]}
        />
      }
      end={
        <>
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
