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
  /** ink for a GameTopNav on an ink page. */
  tone?: "light" | "ink";
  className?: string;
};

const TONES = {
  light: {
    bar: "bg-game-sidebar",
    tab: "text-game-ink hover:bg-game-sidebar",
    current: "bg-game-surface shadow-edge md:bg-game-sidebar md:shadow-none",
  },
  ink: {
    bar: "bg-game-ink-soft",
    tab: "text-white hover:bg-game-ink-soft",
    current: "bg-game-ink-hover md:bg-game-ink-soft",
  },
} as const;

export function PillTabs({ tabs, label = "Main", tone = "light", className }: PillTabsProps) {
  return (
    <nav
      aria-label={label}
      className={gameCn(
        "flex w-full gap-1 rounded-full p-1 md:w-auto md:bg-transparent md:p-0",
        TONES[tone].bar,
        className,
      )}
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.current ? "page" : undefined}
          className={gameCn(
            "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full px-3 text-base md:h-11 md:flex-none md:px-5 no-underline outline-none focus-visible:outline-2 focus-visible:outline-game-found focus-visible:outline-offset-2",
            TONES[tone].tab,
            tab.current && TONES[tone].current,
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
