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
  /** ink sits on an ink page, so the bar and the page read as one surface. */
  tone?: "light" | "ink";
  className?: string;
};

const TONES = {
  light: "border-game-border bg-game-surface text-game-ink",
  ink: "border-transparent bg-game-ink text-white",
} as const;

const logoClass =
  "justify-self-start whitespace-nowrap rounded-sm font-game-serif text-heading lg:text-logo no-underline outline-none focus-visible:outline-2 focus-visible:outline-game-found focus-visible:outline-offset-2";

/** The game top bar: logo, up to five pill tabs and a count with the avatar. Nothing else. */
export function GameTopNav({ logoHref, tabs, end, tone = "light", className }: GameTopNavProps) {
  return (
    <header
      className={gameCn(
        "sticky top-0 z-40 grid flex-none grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 border-b px-4 transition-colors duration-slow ease-game motion-reduce:transition-none pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 md:h-18 md:grid-cols-[auto_1fr_auto] md:gap-4 md:px-6 md:pt-[env(safe-area-inset-top)] md:pb-0 lg:grid-cols-[1fr_auto_1fr] lg:px-10",
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
        <div className="col-span-full row-start-2 flex justify-center md:col-span-1 md:col-start-2 md:row-start-1 md:min-w-0">
          {tabs}
        </div>
      ) : null}
      <div className="col-start-2 row-start-1 flex items-center gap-3 justify-self-end md:col-start-3">
        {end}
      </div>
    </header>
  );
}
