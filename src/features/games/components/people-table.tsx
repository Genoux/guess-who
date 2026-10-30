import type { ReactNode } from "react";
import { gameCn } from "@/shared/components/game/game-cn";
import { GameTooltip } from "@/shared/components/game/game-tooltip";
import "./people-rows.css";

export type PeopleHead = {
  label: string;
  /** Right-aligned, for numbers and times. */
  end?: boolean;
  /** Explains the label on hover and focus. */
  hint?: string;
};

type PeopleTableProps = {
  heads: readonly PeopleHead[];
  /** Whether rows have a menu, whose touch-only column needs an empty caption. */
  menu?: boolean;
  children: ReactNode;
};

export const PEOPLE_ROW_CLASS =
  "people-row h-16 rounded-game-lg bg-game-surface transition-colors duration-fast ease-game motion-reduce:transition-none hoverable:hover:bg-game-bg focus-within:bg-game-bg";

/** The role tag darkens with its row, so a row that must not react to hover leaves this out. */
export const PEOPLE_HOVER_GROUP = "group";

export const PEOPLE_MENU_CLASS =
  "people-menu transition-opacity duration-fast ease-game motion-reduce:transition-none";

/** The last value of a row with a menu, which the dots replace on hover. */
export const PEOPLE_LAST_CLASS =
  "people-last transition-opacity duration-fast ease-game motion-reduce:transition-none";

/** Captions over a list of rows, scrolling sideways in its book on narrow screens. */
export function PeopleTable({ heads, menu = false, children }: PeopleTableProps) {
  return (
    <div className="people-scroll">
      <div className="people-table">
        <div className="people-heads whitespace-nowrap font-game-mono text-game-muted text-xs uppercase">
          {heads.map(({ label, end, hint }, index) => {
            const caption = <span className={hint ? "cursor-help" : undefined}>{label}</span>;
            return (
              <span
                key={label}
                className={gameCn(end && "text-right", index === 0 && "people-who")}
              >
                {hint ? (
                  <GameTooltip label={hint} side="top">
                    {caption}
                  </GameTooltip>
                ) : (
                  caption
                )}
              </span>
            );
          })}
          {menu ? <span className="people-menu-head" /> : null}
        </div>
        <ul className="people-list">{children}</ul>
      </div>
    </div>
  );
}
