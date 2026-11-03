"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { CountChip } from "./count-chip";
import { gameCn } from "./game-cn";
import { TRANSITION } from "./game-motion";

type PillTabBase = {
  label: string;
  /** A shorter label for phones, where a tab with a count has little room. */
  mobileLabel?: string;
  /** The page or view this tab points at is open. */
  current?: boolean;
  /** Shows the yellow dot; the text is its accessible name, e.g. "New clue". */
  badge?: string;
  /** A number after the label, e.g. how many rows the view holds. */
  count?: number;
};

/** A link to a page, or a button that switches a view on the same page. */
export type PillTab = PillTabBase &
  ({ href: string; onSelect?: never } | { onSelect: () => void; href?: never });

type PillTabsProps = {
  /** Up to six tabs. */
  tabs: readonly PillTab[];
  label?: string;
  /** ink for a GameTopNav on an ink page; page for tabs that sit on the page itself. */
  tone?: "light" | "ink" | "page";
  className?: string;
};

// `pill` is the open tab's background, which slides to the next one; `hover` reacts only on tabs
// that are not open, so the open one holds still under the pointer.
const TONES = {
  page: {
    bar: "bg-game-hover",
    text: "text-game-ink",
    hover: "hoverable:hover:bg-game-ink/5",
    pill: "bg-game-surface shadow-edge",
  },
  light: {
    bar: "bg-game-sidebar",
    text: "text-game-ink",
    hover: "hoverable:hover:bg-game-hover md:hoverable:hover:bg-game-sidebar",
    pill: "bg-game-surface shadow-edge md:bg-game-sidebar md:shadow-none",
  },
  ink: {
    bar: "bg-game-ink-soft",
    text: "text-white",
    hover: "hoverable:hover:bg-game-ink-hover md:hoverable:hover:bg-game-ink-soft",
    pill: "bg-game-ink-hover md:bg-game-ink-soft",
  },
} as const;

export function PillTabs({ tabs, label = "Main", tone = "light", className }: PillTabsProps) {
  const pillId = useId();
  const bar = useRef<HTMLElement>(null);

  // Where six tabs cannot share a phone's width the row scrolls sideways; bring the open one in view.
  useEffect(() => {
    const row = bar.current;
    const open = row?.querySelector<HTMLElement>("[aria-current]");
    if (!row || !open || row.scrollWidth <= row.clientWidth) return;
    row.scrollLeft = open.offsetLeft - (row.clientWidth - open.offsetWidth) / 2;
  });

  return (
    <nav
      ref={bar}
      aria-label={label}
      className={gameCn(
        "flex w-full gap-1 overflow-x-auto rounded-full p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        tone === "page" ? "md:w-fit" : "md:w-auto md:overflow-visible md:bg-transparent md:p-0",
        tabs.length > 5 && "max-md:gap-0.5",
        tone === "page" && "max-md:gap-0.5 max-md:p-0.5",
        TONES[tone].bar,
        className,
      )}
    >
      {tabs.map((tab) => {
        const classes = gameCn(
          "relative inline-flex h-10 flex-auto shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full border-0 px-3 text-base transition-colors duration-fast ease-game md:h-11 md:flex-none md:px-5 no-underline outline-none focus-visible:outline-2 focus-visible:outline-game-found focus-visible:outline-offset-2 motion-reduce:transition-none",
          // Four or more tabs share a phone's width: tighter padding and a smaller label keep each on one line.
          tabs.length > 3 && "max-md:px-2 max-md:text-small",
          tabs.length > 5 && "max-md:px-1 max-md:text-[0.8125rem]",
          // Five or six nav tabs beside the logo on a tablet: tighter until there is room.
          tabs.length > 4 && tone !== "page" && "md:max-lg:px-2.5 md:max-lg:text-small",
          // Tabs that carry a count are wider: tighter on a phone so four of them fit.
          tone === "page" &&
            "max-md:gap-1 max-md:px-1.5 max-md:text-[0.8125rem] max-[24rem]:px-1 max-[24rem]:text-xs",
          TONES[tone].text,
          !tab.current && TONES[tone].hover,
        );
        const content = (
          <>
            {tab.current ? (
              <motion.span
                aria-hidden
                layoutId={pillId}
                transition={TRANSITION.enter}
                className={gameCn("absolute inset-0 rounded-full", TONES[tone].pill)}
              />
            ) : null}
            {tab.mobileLabel ? (
              <>
                <span className="relative md:hidden">{tab.mobileLabel}</span>
                <span className="relative max-md:hidden">{tab.label}</span>
              </>
            ) : (
              <span className="relative">{tab.label}</span>
            )}
            {tab.count === undefined ? null : (
              <CountChip
                size="xs"
                variant={tab.current ? "default" : "soft"}
                className={gameCn("relative", tone === "page" && "max-md:h-5 max-md:px-1.5")}
              >
                {tab.count}
              </CountChip>
            )}
            {tab.badge ? (
              <span className="relative size-2 flex-none rounded-full bg-game-shortlist">
                <span className="sr-only">{tab.badge}</span>
              </span>
            ) : null}
          </>
        );
        return tab.href === undefined ? (
          <button
            key={tab.label}
            type="button"
            aria-current={tab.current ? "page" : undefined}
            onClick={tab.onSelect}
            className={classes}
          >
            {content}
          </button>
        ) : (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.current ? "page" : undefined}
            className={classes}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
