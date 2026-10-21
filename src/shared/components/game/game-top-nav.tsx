import Link from "next/link";
import type { ReactNode } from "react";
import { gameCn } from "./game-cn";

type GameTopNavProps = {
  /** Where the logo goes; plain text when omitted. */
  logoHref?: string;
  /** Up to two pill tabs, centered: pass a PillTabs. */
  tabs?: ReactNode;
  /** Right side: a CountChip and the player's GameAvatar. */
  end?: ReactNode;
  className?: string;
};

const logoClass =
  "justify-self-start rounded-sm font-game-serif text-logo text-game-ink no-underline outline-none focus-visible:outline-2 focus-visible:outline-game-found focus-visible:outline-offset-2";

/** The game top bar: logo, up to two pill tabs and a count with the avatar. Nothing else. */
export function GameTopNav({ logoHref, tabs, end, className }: GameTopNavProps) {
  return (
    <header
      className={gameCn(
        "grid flex-none grid-cols-[auto_1fr] items-center gap-4 border-game-border border-b bg-game-surface px-4 py-3 md:h-18 md:grid-cols-[1fr_auto_1fr] md:px-10 md:py-0",
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
      <div className="col-span-full row-start-2 flex justify-center md:col-span-1 md:col-start-2 md:row-start-1">
        {tabs}
      </div>
      <div className="col-start-2 row-start-1 flex items-center gap-3 justify-self-end md:col-start-3">
        {end}
      </div>
    </header>
  );
}
