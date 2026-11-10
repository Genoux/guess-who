import { eq, notInArray, sql } from "drizzle-orm";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import { TEAM_DEFINITIONS } from "@/entities/teams";
import * as schema from "./schema";

type SchemaDb = NeonDatabase<typeof schema>;

/**
 * Makes the teams table match the one definition, by name, and returns the ids. A team that
 * changed its name is renamed in place first, so the people on it stay on it; a team no longer
 * defined is deleted, and its people are left with no team.
 */
export async function seedTeams(db: SchemaDb): Promise<Map<string, string>> {
  const existing = await db.select({ name: schema.teams.name }).from(schema.teams);
  const names = new Set(existing.map(({ name }) => name));
  for (const team of TEAM_DEFINITIONS) {
    if ("formerName" in team && names.has(team.formerName) && !names.has(team.name)) {
      await db
        .update(schema.teams)
        .set({ name: team.name })
        .where(eq(schema.teams.name, team.formerName));
    }
  }

  await db
    .insert(schema.teams)
    .values(
      TEAM_DEFINITIONS.map(({ name, color, tint }, index) => ({
        name,
        color,
        tint,
        sortOrder: index + 1,
      })),
    )
    .onConflictDoUpdate({
      target: schema.teams.name,
      set: {
        color: sql`excluded.color`,
        tint: sql`excluded.tint`,
        sortOrder: sql`excluded.sort_order`,
      },
    });
  await db.delete(schema.teams).where(
    notInArray(
      schema.teams.name,
      TEAM_DEFINITIONS.map(({ name }) => name),
    ),
  );

  const rows = await db.select({ id: schema.teams.id, name: schema.teams.name }).from(schema.teams);
  return new Map(rows.map((team) => [team.name, team.id]));
}
