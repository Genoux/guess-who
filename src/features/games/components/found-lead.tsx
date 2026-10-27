import type { ReactNode } from "react";

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

type FoundEmphasis = "found" | "ink";

/**
 * "3 days, with 2 clues" with the numbers highlighted so they read first: orange on the page, ink
 * on the reveal, where orange is the background. Null until the find's numbers are known.
 */
function foundStats(
  day: number | null,
  clues: number | null,
  emphasis: FoundEmphasis = "found",
): ReactNode {
  if (day === null || clues === null) return null;
  const strong = emphasis === "found" ? "font-medium text-game-found" : "font-medium text-game-ink";
  return (
    <>
      <strong className={strong}>{plural(day, "day")}</strong>, with{" "}
      <strong className={strong}>{clues === 0 ? "no clues" : plural(clues, "clue")}</strong>
    </>
  );
}

/** How the find went, as a sentence of its own. */
export function foundLead(
  day: number | null,
  clues: number | null,
  emphasis: FoundEmphasis = "found",
) {
  const stats = foundStats(day, clues, emphasis);
  return stats ? <>Found in {stats}.</> : "You found them.";
}
