"use client";

import { SearchIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { gameCn } from "./game-cn";

type GameSearchFieldProps = Omit<ComponentProps<"input">, "type" | "children"> & {
  /** Names the field for screen readers; the placeholder is only a hint. */
  label: string;
};

/** A pill search box that filters a list as you type. */
export function GameSearchField({ label, className, ...props }: GameSearchFieldProps) {
  return (
    <label className={gameCn("relative block min-w-0", className)}>
      <span className="sr-only">{label}</span>
      <SearchIcon
        aria-hidden
        className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-4.5 size-4.5 text-game-muted"
      />
      <input
        type="search"
        autoComplete="off"
        className="h-11 w-full rounded-full border-[1.5px] border-game-border bg-game-sidebar pr-4.5 pl-11.5 font-game-sans text-base text-game-ink outline-none placeholder:text-game-muted focus:border-game-ink focus:bg-game-surface"
        {...props}
      />
    </label>
  );
}
