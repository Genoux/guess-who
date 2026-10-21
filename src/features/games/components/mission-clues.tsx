import { ClueCard } from "@/shared/components/game/clue-card";
import type { MissionClue } from "../queries/get-player-mission";

const ROTATIONS = [-3, 1.5, -1, 2.5];

/** The four clue cards: open, new or face down with the day they land. */
export function MissionClues({ clues }: { clues: MissionClue[] }) {
  return (
    <ul aria-label="Clues" className="flex flex-wrap justify-center gap-5">
      {clues.map((clue, index) => (
        <li key={clue.number}>
          <ClueCard
            state={clue.state}
            label={
              clue.state === "down" ? `Day ${clue.day}` : `Clue ${clue.number} · Day ${clue.day}`
            }
            text={clue.text ?? undefined}
            rot={ROTATIONS[index]}
          />
        </li>
      ))}
    </ul>
  );
}
