type ClueAccessInput = {
  number: number;
  /** What the welcomer saved for this clue. */
  text: string | null;
  over: boolean;
  /** The game's first day has come. */
  started: boolean;
};

/**
 * What the welcomer may do with a clue: free until the game plays, then a saved clue is locked and
 * an unwritten one can still be added. Clue 1 is generated; once the game is over nothing changes.
 */
export function welcomerClueAccess({ number, text, over, started }: ClueAccessInput) {
  if (number === 1 || over) return { editable: false, locked: false };
  const locked = started && Boolean(text);
  return { editable: !locked, locked };
}
