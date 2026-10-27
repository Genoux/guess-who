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
  /** Up to three tabs. */
  tabs: readonly [PillTab] | readonly [PillTab, PillTab] | readonly [PillTab, PillTab, PillTab];
  label?: string;
  className?: string;
};

export function PillTabs({ tabs, label = "Main", className }: PillTabsProps) {
  return (
    <nav
      aria-label={label}
      className={gameCn(
        "flex w-full gap-1 rounded-full bg-game-sidebar p-1 md:w-auto md:bg-transparent md:p-0",
        className,
      )}
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.current ? "page" : undefined}
          className={gameCn(
            "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full px-3 text-base md:h-11 md:flex-none md:px-5 text-game-ink no-underline outline-none hover:bg-game-sidebar focus-visible:outline-2 focus-visible:outline-game-found focus-visible:outline-offset-2",
            tab.current && "bg-game-surface shadow-edge md:bg-game-sidebar md:shadow-none",
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
