/** The mono line above the words of a finished game. */
export function endingEyebrow({ found, revealSeen }: { found: boolean; revealSeen: boolean }) {
  if (found) return "Mission complete";
  return revealSeen ? "Day 14" : "Day 14 · Time’s up";
}
