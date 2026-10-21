import { cva } from "class-variance-authority";
import type { ReactNode } from "react";
import { gameCn } from "./game-cn";

export type ClueCardState = "down" | "new" | "open";

type ClueCardProps = {
  /** Face down until its day, yellow when new, white once read. */
  state: ClueCardState;
  size?: "sm" | "lg";
  /** Caption: "Clue 2 · Day 6" on a face-up card, "Day 9" on a face-down one. */
  label: string;
  /** The clue itself; ignored while the card is face down. */
  text?: string;
  /** Small line pinned to the bottom of a face-up card, e.g. "From your welcomer". */
  footer?: ReactNode;
  /** Hand-placed angle in degrees. */
  rot?: number;
  className?: string;
};

const clueCardVariants = cva("flex flex-none flex-col text-left", {
  variants: {
    state: {
      down: "items-center justify-center bg-game-ink text-center text-white",
      new: "bg-game-shortlist text-game-ink shadow-ink",
      open: "bg-game-surface text-game-ink shadow-ink",
    },
    size: {
      sm: "h-65 w-50 gap-3 rounded-clue p-5",
      lg: "h-105 w-80 gap-3 rounded-clue-lg p-7",
    },
  },
});

export function ClueCard({
  state,
  size = "sm",
  label,
  text,
  footer,
  rot,
  className,
}: ClueCardProps) {
  const style = rot ? { transform: `rotate(${rot}deg)` } : undefined;

  if (state === "down") {
    return (
      <div className={gameCn(clueCardVariants({ state, size }), className)} style={style}>
        <span
          aria-hidden
          className={gameCn(
            "font-game-serif text-game-shortlist",
            size === "lg" ? "text-mark-lg" : "text-mark",
          )}
        >
          ?
        </span>
        <span className="font-game-mono text-caption text-game-border-strong uppercase">
          <span className="sr-only">Clue face down, </span>
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className={gameCn(clueCardVariants({ state, size }), className)} style={style}>
      <span
        className={gameCn(
          "font-game-mono text-caption uppercase",
          state === "new" ? "text-game-ink" : "text-game-muted",
        )}
      >
        {label}
      </span>
      <span className={gameCn("font-game-serif", size === "lg" ? "text-clue-lg" : "text-clue")}>
        {text}
      </span>
      {footer ? <span className="mt-auto text-small">{footer}</span> : null}
    </div>
  );
}
