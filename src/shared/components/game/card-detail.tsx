import type { ComponentProps, ReactNode } from "react";
import { gameCn } from "./game-cn";

type CardDetailProps = {
  card: ReactNode;
  /** Controls that act on the card itself, kept under it and apart from the panel. */
  cardFooter?: ReactNode;
  /** Absent, the card stands alone in a single column. */
  panel?: ReactNode;
  /** The decision on the whole card, across both columns; hidden while it holds no button. */
  footer?: ReactNode;
  className?: string;
};

/** One open card: the card on the left, what you know and write about it on the right. */
export function CardDetail({ card, cardFooter, panel, footer, className }: CardDetailProps) {
  return (
    <div
      className={gameCn(
        "mx-auto grid w-full max-w-220 justify-items-center gap-8 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:justify-items-stretch md:gap-x-16",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-5">
        {card}
        {cardFooter}
      </div>
      {panel && (
        <div className="flex w-full min-w-0 max-w-md flex-col justify-self-center text-left md:max-w-none md:justify-self-stretch">
          {panel}
        </div>
      )}
      {/* The decision can unmount its own button (a guess that was just ruled out); an empty row
          would still take a grid gap and push the centered detail up. */}
      {footer && <div className="hidden w-full has-[button]:block md:col-span-2">{footer}</div>}
    </div>
  );
}

const labelClass = "font-game-mono text-caption text-game-muted uppercase";

/** The small mono label over a block of the panel, as the card prints "Ask me about". */
export function CardDetailLabel({ className, ...props }: ComponentProps<"span">) {
  return <span className={gameCn(labelClass, className)} {...props} />;
}

export type CardDetailFact = { label: string; value: string | null | undefined };

/** The card's own fields as label and value rows; rows without a value are left out. */
export function CardDetailFacts({ facts }: { facts: readonly CardDetailFact[] }) {
  const shown = facts.filter((fact) => fact.value);
  if (shown.length === 0) return null;
  return (
    <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-baseline gap-x-4 gap-y-4 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-x-6">
      {shown.map((fact) => (
        <div key={fact.label} className="contents">
          <dt className={labelClass}>{fact.label}</dt>
          <dd className="text-pretty text-lead">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
