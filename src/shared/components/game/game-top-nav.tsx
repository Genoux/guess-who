import Link from "next/link";
import type { ReactNode } from "react";
import { gameCn } from "./game-cn";

type GameTopNavProps = {
  /** Where the logo goes; plain text when omitted. */
  logoHref?: string;
  /** Up to five pill tabs, centered: pass a PillTabs. */
  tabs?: ReactNode;
  /** Right side: a CountChip and the AccountButton. */
  end?: ReactNode;
  /** ink sits on an ink page, so the bar and the page read as one surface; clear tops a
      full-screen moment, in place and see-through, so its logo sits where the page's did. */
  tone?: "light" | "ink" | "clear";
  className?: string;
};

const TONES = {
  light: "border-game-border bg-game-surface text-game-ink",
  ink: "border-transparent bg-game-ink text-white",
  clear: "static border-transparent text-game-ink",
} as const;

const logoClass =
  "justify-self-start whitespace-nowrap rounded-sm font-game-serif text-heading nav:max-lg:text-lead lg:text-logo no-underline outline-none focus-visible:outline-2 focus-visible:outline-game-found focus-visible:outline-offset-2";

/**
 * The game top bar: logo, up to five pill tabs and a count with the avatar. Nothing else. Between
 * the nav breakpoint and lg the inline bar is squeezed (smaller logo, gaps and padding) so the
 * tabs stay beside the logo at full size for as long as possible.
 */
export function GameTopNav({ logoHref, tabs, end, tone = "light", className }: GameTopNavProps) {
  return (
    <header
      className={gameCn(
        "sticky top-0 z-40 grid flex-none grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 border-b px-4 transition-colors duration-slow ease-game motion-reduce:transition-none pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 nav:h-18 nav:grid-cols-[auto_1fr_auto] nav:gap-3 nav:pt-[env(safe-area-inset-top)] nav:pb-0 lg:grid-cols-[1fr_auto_1fr] lg:gap-4 lg:px-10",
        TONES[tone],
        className,
      )}
    >
      {logoHref ? (
        <Link href={logoHref} className={logoClass}>
          The Album
        </Link>
      ) : (
        <span className={logoClass}>The Album</span>
      )}
      {/* Only with tabs: an empty slot still takes the second row on mobile, and its row gap
          pushes the logo and avatar above center. */}
      {tabs ? (
        <div className="col-span-full row-start-2 flex justify-center nav:col-span-1 nav:col-start-2 nav:row-start-1 nav:min-w-0">
          {tabs}
        </div>
      ) : null}
      {/* min-h-11 holds the row at a close button's height, so the logo sits at the same height
          whether the end is the 40px avatar or a 44px close. */}
      <div className="col-start-2 row-start-1 flex min-h-11 items-center gap-3 justify-self-end nav:col-start-3 nav:max-lg:gap-2">
        {end}
      </div>
    </header>
  );
}
