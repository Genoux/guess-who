import { ClueCard } from "@/shared/components/game/clue-card";
import type { MissionClue, PlayerMission } from "../queries/get-player-mission";

const ROTATIONS = [-3, 1.5, -1, 2.5];

function countdown(inDays: number): string {
  if (inDays <= 0) return "Today";
  if (inDays === 1) return "Tomorrow";
  return `In ${inDays} days`;
}

/** The four clue cards: open, new or face down; the next one counts down to its release. */
export function MissionClues({
  clues,
  nextClue,
}: {
  clues: MissionClue[];
  nextClue: PlayerMission["nextClue"];
}) {
  return (
    <ul aria-label="Clues" className="flex flex-wrap justify-center gap-5">
      {clues.map((clue, index) => (
        <li key={clue.number}>
          <ClueCard
            state={clue.state}
            label={`Clue ${clue.number}`}
            footer={
              clue.state === "down" && nextClue?.number === clue.number
                ? countdown(nextClue.inDays)
                : undefined
            }
            text={clue.text ?? undefined}
            rot={ROTATIONS[index]}
          />
        </li>
      ))}
    </ul>
  );
}
