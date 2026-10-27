import type { ElementType } from "react";
import { endingEyebrow } from "../lib/ending-eyebrow";
import { foundLead } from "./found-lead";

type FoundWordsProps = {
  found: boolean;
  firstName: string;
  foundOnDay: number | null;
  cluesUsed: number | null;
  /** The element that carries the title, so a dialog can make it its own. */
  titleAs: ElementType;
};

/** What a finished game says about its welcomer; the guess and the day 14 reveal both end on it. */
export function FoundWords({
  found,
  firstName,
  foundOnDay,
  cluesUsed,
  titleAs: Title,
}: FoundWordsProps) {
  return (
    <>
      <span className="font-game-mono text-caption uppercase">
        {endingEyebrow({ found, revealSeen: true })}
      </span>
      <Title className="font-game-serif text-center text-4xl sm:text-5xl">
        {found ? "You found" : "It was"} {firstName}
      </Title>
      <p className="text-lead">
        {found
          ? foundLead(foundOnDay, cluesUsed, "ink")
          : "You were close. Now you know who to say hi to."}
      </p>
    </>
  );
}
