import { teamClueText } from "./game-clues";
import { welcomerClueAccess } from "./welcomer-clue-access";

export type DeskClue = {
  number: 1 | 2 | 3 | 4;
  text: string | null;
  /** Theirs to write now. */
  editable: boolean;
  /** Read-only while they welcome a mission that is playing. */
  locked: boolean;
};

type DeskCluesInput = {
  saved: readonly { number: number; text: string }[];
  teamName: string | null;
  /** They welcome a mission that is playing. */
  welcoming: boolean;
};

const NUMBERS = [1, 2, 3, 4] as const;

/** The four clues a teammate sees: the team one, generated, then their own with what they may do. */
export function buildDeskClues({ saved, teamName, welcoming }: DeskCluesInput): DeskClue[] {
  return NUMBERS.map((number) => {
    const text =
      number === 1
        ? teamClueText(teamName)
        : (saved.find((clue) => clue.number === number)?.text ?? null);
    return { number, text, ...welcomerClueAccess({ number, welcoming }) };
  });
}
