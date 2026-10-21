import Link from "next/link";
import { gameCn } from "./game-cn";

export type PillTab = {
  href: string;
  label: string;
  /** The page this tab points at is open. */
  current?: boolean;
  /** Shows the yellow dot; the text is its accessible name, e.g. "New clue". */
  badge?: string;
};

type PillTabsProps = {
  /** Up to two tabs. */
  tabs: readonly [PillTab] | readonly [PillTab, PillTab];
  label?: string;
  className?: string;
};

export function PillTabs({ tabs, label = "Main", className }: PillTabsProps) {
  return (
    <nav aria-label={label} className={gameCn("flex gap-1", className)}>
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.current ? "page" : undefined}
          className={gameCn(
            "inline-flex h-11 items-center gap-2 rounded-full px-5 text-base text-game-ink no-underline outline-none hover:bg-game-sidebar focus-visible:outline-2 focus-visible:outline-game-found focus-visible:outline-offset-2",
            tab.current && "bg-game-sidebar",
          )}
        >
          {tab.label}
          {tab.badge ? (
            <span className="size-2 flex-none rounded-full bg-game-shortlist">
              <span className="sr-only">{tab.badge}</span>
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
