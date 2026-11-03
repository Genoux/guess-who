import type { DeskClue } from "./desk-clues";

/** Clue 1 is the person's team: until they have one it has no text, and the flow cannot go past it. */
export const clueNeedsTeam = ({ number, text }: Pick<DeskClue, "number" | "text">) =>
  number === 1 && text === null;

export const teamMissing = (clues: readonly DeskClue[]) => clues.some(clueNeedsTeam);

/** Whether Next may leave the clue at `index`: never from a clue 1 that has no team yet. */
export function canAdvanceFrom(clues: readonly DeskClue[], index: number): boolean {
  const clue = clues[index];
  return !clue || !clueNeedsTeam(clue);
}
