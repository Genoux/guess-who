import { cva } from "class-variance-authority";
import { LockIcon } from "lucide-react";
import type { ReactNode } from "react";
import { CardBacking, cardSurfaceVariants } from "./card-surface";
import { gameCn } from "./game-cn";

export type ClueCardState = "locked" | "down" | "up";

type ClueCardProps = {
  /** Locked until its day, face down until the player turns it over, then yellow. */
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

const clueSizeVariants = cva("relative flex-none text-left", {
  variants: {
    size: { sm: "h-65 w-50", lg: "h-105 w-80" },
  },
});

const clueFaceVariants = cva("absolute inset-0 flex flex-col", {
  variants: {
    state: {
      locked:
        "items-center justify-center border-dashed border-game-muted bg-game-surface text-center text-game-ink",
      down: "items-center justify-center bg-game-ink text-center text-white",
      up: "bg-game-shortlist text-game-ink",
    },
    size: {
      sm: "gap-3 p-5",
      lg: "gap-3 p-7",
    },
  },
});

/** A clue is a card like a sticker: same edge, corner and hover shadow. */
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
  const faceClassName = gameCn(cardSurfaceVariants({ size }), clueFaceVariants({ state, size }));

  return (
    <div className={gameCn(clueSizeVariants({ size }), className)} style={style}>
      {state === "locked" ? null : <CardBacking size={size} />}
      {state === "locked" ? (
        <div className={faceClassName}>
          <span
            aria-hidden
            className={gameCn(
              "flex items-center justify-center rounded-full border-2 border-game-muted border-dashed",
              size === "lg" ? "size-20 [&_svg]:size-8" : "size-14 [&_svg]:size-6",
            )}
          >
            <LockIcon strokeWidth={2} />
          </span>
          <span className="font-game-mono text-caption uppercase">
            <span className="sr-only">Clue locked, </span>
            {label}
          </span>
          {footer ? <span className="text-game-muted text-small">{footer}</span> : null}
        </div>
      ) : state === "down" ? (
        <div className={faceClassName}>
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
      ) : (
        <div className={faceClassName}>
          <span className="font-game-mono text-caption uppercase">{label}</span>
          <span className={gameCn("font-game-serif", size === "lg" ? "text-clue-lg" : "text-clue")}>
            {text}
          </span>
          {footer ? <span className="mt-auto text-small">{footer}</span> : null}
        </div>
      )}
    </div>
  );
}
