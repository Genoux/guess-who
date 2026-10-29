const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const DAYS_IN_WEEK = 7;

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** When the new hire last did something, in words, from `now` so the server fixes it at render. */
export function describeActivity(lastActiveAt: Date | null, now: Date): string {
  if (!lastActiveAt) return "No activity yet";
  const elapsed = Math.max(0, now.getTime() - lastActiveAt.getTime());
  if (elapsed < MINUTE_MS) return "Active just now";
  if (elapsed < HOUR_MS)
    return `Active ${relative.format(-Math.floor(elapsed / MINUTE_MS), "minute")}`;
  if (elapsed < DAY_MS) return `Active ${relative.format(-Math.floor(elapsed / HOUR_MS), "hour")}`;
  const days = Math.floor(elapsed / DAY_MS);
  if (days < DAYS_IN_WEEK) return `Active ${relative.format(-days, "day")}`;
  return `Active ${relative.format(-Math.floor(days / DAYS_IN_WEEK), "week")}`;
}
