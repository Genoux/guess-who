"use client";

import { Tooltip } from "@inbeat/ui/components/tooltip";
import { AccountButton } from "@/shared/components/account-button";
import { CountChip } from "@/shared/components/game/count-chip";
import { GameTopNav } from "@/shared/components/game/game-top-nav";
import { PillTabs } from "@/shared/components/game/pill-tabs";
import { ROUTES } from "@/shared/config/routes";
import { type NavPage, type TopNavData, topNavTabs } from "../lib/top-nav";

type AppTopNavProps = {
  nav: TopNavData;
  current: NavPage;
  tone?: "light" | "ink";
};

/**
 * The top bar of every signed-in screen: Album, Mission when there is one, My card, My clues and
 * Welcomer while welcoming and People for admins as tabs; the stickers count and the account
 * menu sit beside them.
 */
export function AppTopNav({ nav, current, tone = "light" }: AppTopNavProps) {
  const tabs = topNavTabs(nav, current);
  return (
    <GameTopNav
      logoHref={ROUTES.play}
      tone={tone}
      tabs={tabs.length > 0 ? <PillTabs tone={tone} tabs={tabs} /> : undefined}
      end={
        <>
          {nav.hasMission ? (
            <Tooltip content="Stickers collected" side="bottom">
              <CountChip>
                <span className="sr-only">Stickers collected: </span>
                {nav.collectedCount} / {nav.total}
              </CountChip>
            </Tooltip>
          ) : null}
          <AccountButton />
        </>
      }
    />
  );
}
