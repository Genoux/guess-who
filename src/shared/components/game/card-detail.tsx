import type { ReactNode } from "react";
import { gameCn } from "./game-cn";

type CardDetailProps = {
  card: ReactNode;
  /** Controls that act on the card itself, kept under it and apart from the panel. */
  cardFooter?: ReactNode;
  panel: ReactNode;
  /** The decision on the whole card, across both columns. */
  footer?: ReactNode;
  className?: string;
};

/** One open card: the card on the left, what you know and write about it on the right. */
export function CardDetail({ card, cardFooter, panel, footer, className }: CardDetailProps) {
  return (
    <div
      className={gameCn(
        "mx-auto grid w-full max-w-220 justify-items-center gap-10 md:grid-cols-[auto_minmax(0,1fr)] md:items-start md:justify-items-stretch md:gap-16",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-5">
        {card}
        {cardFooter}
      </div>
      <div className="flex w-full min-w-0 max-w-md flex-col justify-self-center text-left md:max-w-none md:justify-self-stretch">
        {panel}
      </div>
      {footer && <div className="w-full md:col-span-2">{footer}</div>}
    </div>
  );
}

const labelClass = "font-game-mono text-caption text-game-muted uppercase";

/** The small mono label over a block of the panel, as the card prints "Ask me about". */
export function CardDetailLabel({ children }: { children: ReactNode }) {
  return <span className={labelClass}>{children}</span>;
}

export type CardDetailFact = { label: string; value: string | null | undefined };

/** The card's own fields as label and value rows; rows without a value are left out. */
export function CardDetailFacts({ facts }: { facts: readonly CardDetailFact[] }) {
  const shown = facts.filter((fact) => fact.value);
  if (shown.length === 0) return null;
  return (
    <dl className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-baseline gap-x-6 gap-y-4">
      {shown.map((fact) => (
        <div key={fact.label} className="contents">
          <dt className={labelClass}>{fact.label}</dt>
          <dd className="text-pretty text-lead">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
