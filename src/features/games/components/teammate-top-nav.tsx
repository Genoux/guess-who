import { AccountButton } from "@/shared/components/account-button";
import { GameTopNav } from "@/shared/components/game/game-top-nav";
import { PillTabs } from "@/shared/components/game/pill-tabs";
import { ROUTES } from "@/shared/config/routes";

type TeammateTopNavProps = {
  current: "card" | "welcomer";
  /** Adds the Welcomer tab beside My card. */
  welcomer: boolean;
  tone?: "light" | "ink";
};

/** A teammate's top bar: My card, plus Welcomer while they welcome a new hire, and the account menu. */
export function TeammateTopNav({ current, welcomer, tone }: TeammateTopNavProps) {
  return (
    <GameTopNav
      logoHref={ROUTES.home}
      tone={tone}
      tabs={
        welcomer ? (
          <PillTabs
            tone={tone}
            tabs={[
              { href: ROUTES.card, label: "My card", current: current === "card" },
              { href: ROUTES.welcomer, label: "Welcomer", current: current === "welcomer" },
            ]}
          />
        ) : undefined
      }
      end={<AccountButton />}
    />
  );
}
