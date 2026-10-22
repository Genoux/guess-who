import { cva } from "class-variance-authority";
import type { ReactNode } from "react";
import { cardSurfaceVariants } from "./card-surface";
import { gameCn } from "./game-cn";

export type ClueCardState = "down" | "new" | "open";

type ClueCardProps = {
  /** Face down until its day, yellow when new, white once read. */
  state: ClueCardState;
  size?: "sm" | "lg";
  /** Caption: which clue it is, "Clue 2". Never the day: timing goes in the footer as a countdown. */
  label: string;
  /** The clue itself; ignored while the card is face down. */
  text?: string;
  /** Small line: "From your welcomer" at the bottom of a face-up card, "In 3 days" under a face-down one. */
  footer?: ReactNode;
  /** Hand-placed angle in degrees. */
  rot?: number;
  className?: string;
};

const clueCardVariants = cva("flex flex-none flex-col text-left", {
  variants: {
    state: {
      down: "items-center justify-center bg-game-ink text-center text-white",
      new: "bg-game-shortlist text-game-ink",
      open: "bg-game-surface text-game-ink",
    },
    size: {
      sm: "h-65 w-50 gap-3 p-5",
      lg: "h-105 w-80 gap-3 p-7",
    },
  },
});

/** A clue is a card like a sticker: same edge and corner, and the ink shadow once it is face up. */
const clueClasses = (state: ClueCardState, size: "sm" | "lg", className?: string) =>
  gameCn(
    clueCardVariants({ state, size }),
    cardSurfaceVariants({ size, shadow: state === "down" ? "none" : "ink" }),
    className,
  );

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
      <div className={clueClasses(state, size, className)} style={style}>
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
        {footer ? <span className="text-game-shortlist text-small">{footer}</span> : null}
      </div>
    );
  }

  return (
    <div className={clueClasses(state, size, className)} style={style}>
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
