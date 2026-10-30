const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const DAYS_IN_WEEK = 7;

const compactAgo = (elapsed: number): string => {
  if (elapsed < MINUTE_MS) return "just now";
  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)}m ago`;
  if (elapsed < DAY_MS) return `${Math.floor(elapsed / HOUR_MS)}h ago`;
  const days = Math.floor(elapsed / DAY_MS);
  return days < DAYS_IN_WEEK ? `${days}d ago` : `${Math.floor(days / DAYS_IN_WEEK)}w ago`;
};

/** When the player last did something, compact ("3h ago"); `now` is fixed by the server at render. */
export function describeActivity(lastActiveAt: Date | null, now: Date): string {
  if (!lastActiveAt) return "Not yet";
  return compactAgo(Math.max(0, now.getTime() - lastActiveAt.getTime()));
}

/** When a mission was turned on, to the day: "today", "3d ago". */
export function describeTurnedOn(turnedOnAt: Date, now: Date): string {
  const elapsed = Math.max(0, now.getTime() - turnedOnAt.getTime());
  return elapsed < DAY_MS ? "today" : compactAgo(elapsed);
}
