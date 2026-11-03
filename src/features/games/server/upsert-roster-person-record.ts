import "server-only";
import { eq, inArray, or } from "drizzle-orm";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import type * as schema from "@/db/schema";
import { people, teams } from "@/db/schema";
import type { RosterPerson } from "@/integrations/deel/to-roster-change";

type Executor = Pick<NeonDatabase<typeof schema>, "select" | "insert" | "update">;

export type UpsertOutcome = "created" | "updated" | "conflict";

/**
 * Writes the Deel-owned fields of one person and nothing else: fact, ask, clues, flags and games
 * are never touched. The person is the row with that deel id, else the row whose `email` is
 * the same and that has no deel id yet (someone who signed in before the roster came from Deel). Any other
 * row holding either email, in either column, makes the write a `conflict` and changes nothing.
 */
export async function upsertRosterPersonRecord(
  executor: Executor,
  roster: RosterPerson,
): Promise<UpsertOutcome> {
  const emails = [roster.email, roster.personalEmail].filter((email) => email !== null);
  const holders = await executor
    .select({ id: people.id, deelId: people.deelId, email: people.email })
    .from(people)
    .where(
      or(
        eq(people.deelId, roster.deelId),
        inArray(people.email, emails),
        inArray(people.personalEmail, emails),
      ),
    );

  const target =
    holders.find(({ deelId }) => deelId === roster.deelId) ??
    holders.find(({ deelId, email }) => deelId === null && email === roster.email);
  if (holders.some(({ id }) => id !== target?.id)) return "conflict";

  const [team] = roster.team
    ? await executor.select({ id: teams.id }).from(teams).where(eq(teams.name, roster.team))
    : [];

  const values = {
    deelId: roster.deelId,
    name: roster.name,
    email: roster.email,
    personalEmail: roster.personalEmail,
    startDate: roster.startDate,
  };
  if (!target) {
    await executor
      .insert(people)
      .values({ ...values, teamId: team?.id ?? null, location: roster.location });
    return "created";
  }
  // Deel having no team or country keeps what the row already has.
  await executor
    .update(people)
    .set({
      ...values,
      ...(team && { teamId: team.id }),
      ...(roster.location && { location: roster.location }),
    })
    .where(eq(people.id, target.id));
  return "updated";
}
