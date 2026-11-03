import type { ComponentProps, ReactNode } from "react";
import { gameCn } from "./game-cn";

type CardDetailProps = {
  card: ReactNode;
  /** Controls that act on the card itself, kept under it and apart from the panel. */
  cardFooter?: ReactNode;
  /** Absent, the card stands alone in a single column. */
  panel?: ReactNode;
  /** What acts on the whole card, centered under both columns; hidden while it holds no button. */
  footer?: ReactNode;
  className?: string;
};

/** One open card: the card on the left, what you write about it on the right, its action below. */
export function CardDetail({ card, cardFooter, panel, footer, className }: CardDetailProps) {
  return (
    <div
      className={gameCn(
        "@container mx-auto grid w-full max-w-220 justify-items-center gap-8 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:justify-items-stretch md:gap-x-16",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-5">
        {card}
        {cardFooter}
      </div>
      {panel && (
        <div className="flex w-full min-w-0 max-w-md flex-col justify-self-center text-left md:justify-self-start">
          {panel}
        </div>
      )}
      {/* The action can unmount its own button (a guess that was just ruled out); an empty row
          would still take a grid gap and push the centered detail up. */}
      {footer && <div className="hidden w-full has-[button]:block md:col-span-2">{footer}</div>}
    </div>
  );
}

/** The small mono label over a block of the panel, as the card prints "Ask me about". */
export function CardDetailLabel({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={gameCn("font-game-mono text-caption text-game-muted uppercase", className)}
      {...props}
    />
  );
}
