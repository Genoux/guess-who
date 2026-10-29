import { AccountButton } from "@/shared/components/account-button";
import { GameTopNav } from "@/shared/components/game/game-top-nav";
import { PillTabs } from "@/shared/components/game/pill-tabs";
import { ROUTES } from "@/shared/config/routes";

type TeammateTopNavProps = {
  current: "admin" | "card" | "clues" | "welcomer";
  /** Adds the New hires tab. */
  admin: boolean;
  /** Adds the Welcomer tab while they are welcoming a new hire. */
  welcomer: boolean;
  tone?: "light" | "ink";
};

/** A teammate's top bar: New hires for admins, My card, My clues, Welcomer while welcoming, and the account menu. */
export function TeammateTopNav({ current, admin, welcomer, tone }: TeammateTopNavProps) {
  const navTabs = [
    ...(admin ? [{ href: ROUTES.admin, label: "New hires", current: current === "admin" }] : []),
    { href: ROUTES.card, label: "My card", current: current === "card" },
    { href: ROUTES.clues, label: "My clues", current: current === "clues" },
    ...(welcomer
      ? [{ href: ROUTES.welcomer, label: "Welcomer", current: current === "welcomer" }]
      : []),
  ];

  return (
    <GameTopNav
      logoHref={ROUTES.home}
      tone={tone}
      tabs={<PillTabs tone={tone} tabs={navTabs} />}
      end={<AccountButton />}
    />
  );
}
