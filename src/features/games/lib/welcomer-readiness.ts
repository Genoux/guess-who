/** Clues 2 to 4 are the teammate's to write; clue 1 is generated from their team. */
export const CLUE_NUMBERS_TO_WRITE = [2, 3, 4] as const;

export const cluesReady = (writtenNumbers: readonly number[]) =>
  CLUE_NUMBERS_TO_WRITE.every((number) => writtenNumbers.includes(number));

/** What stands between a teammate and being picked as a welcomer. */
export type AsWelcomer =
  | { kind: "canWelcome" }
  | { kind: "cluesMissing"; missing: number }
  | { kind: "cardNotDone" };

type CardFields = { hasTeam: boolean; ask: string | null };

/** The card comes first, then the three clues; a mission has no requirements of its own. */
export function asWelcomer({ hasTeam, ask }: CardFields, cluesWritten: number): AsWelcomer {
  if (!hasTeam || !ask?.trim()) return { kind: "cardNotDone" };
  const missing = CLUE_NUMBERS_TO_WRITE.length - cluesWritten;
  return missing > 0 ? { kind: "cluesMissing", missing } : { kind: "canWelcome" };
}

export function asWelcomerLabel(readiness: AsWelcomer): string {
  if (readiness.kind === "canWelcome") return "Can welcome";
  if (readiness.kind === "cardNotDone") return "Card not done";
  return `${readiness.missing} ${readiness.missing === 1 ? "clue" : "clues"} missing`;
}

export const canWelcome = (readiness: AsWelcomer) => readiness.kind === "canWelcome";

/** A mission is turned on for a teammate who can welcome, and for a new hire whatever their card says. */
export const canTurnOn = ({ newHire, asWelcomer }: { newHire: boolean; asWelcomer: AsWelcomer }) =>
  newHire || canWelcome(asWelcomer);
