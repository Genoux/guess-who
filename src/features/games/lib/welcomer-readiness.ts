/** Clues 2 to 4 are the teammate's to write; clue 1 is generated from their team. */
export const CLUE_NUMBERS_TO_WRITE = [2, 3, 4] as const;

export const cluesReady = (writtenNumbers: readonly number[]) =>
  CLUE_NUMBERS_TO_WRITE.every((number) => writtenNumbers.includes(number));

export type Missing =
  | { kind: "card"; label: string }
  | { kind: "clues"; written: number; label: string };

type CardFields = { teamId: string | null; ask: string | null };

/** What stops a teammate from being picked as a welcomer; null when nothing does. */
export function missingFor(
  { teamId, ask }: CardFields,
  writtenNumbers: readonly number[],
): Missing | null {
  if (teamId === null || !ask?.trim()) return { kind: "card", label: "Card not finished" };
  if (cluesReady(writtenNumbers)) return null;
  const written = CLUE_NUMBERS_TO_WRITE.filter((number) => writtenNumbers.includes(number)).length;
  return { kind: "clues", written, label: `${written} of ${CLUE_NUMBERS_TO_WRITE.length} clues` };
}

const rank = (missing: Missing) => (missing.kind === "card" ? -1 : missing.written);

/** Least ready first: unfinished cards, then the fewest clues, then by name. */
export function sortByMissing<T extends { name: string; missing: Missing }>(entries: readonly T[]) {
  return [...entries].sort(
    (a, b) => rank(a.missing) - rank(b.missing) || a.name.localeCompare(b.name),
  );
}
