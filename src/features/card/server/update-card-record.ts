import "server-only";
import { AppError } from "@inbeat/core/errors";
import { eq } from "drizzle-orm";
import { people, teams } from "@/db/schema";
import { db } from "@/shared/lib/db";
import type { UpdateMyCardInput } from "../schemas";
import type { CardFields } from "../types";

/** Saves the person's own sticker fields; the team must exist. */
export async function updateCardRecord(
  input: UpdateMyCardInput,
  personId: string,
): Promise<CardFields> {
  const [team] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.id, input.teamId))
    .limit(1);
  if (!team) {
    throw new AppError("validation", "unknown team", { safeMessage: "Pick your team." });
  }

  const [saved] = await db
    .update(people)
    .set({ teamId: team.id, location: input.location, fact: input.fact, ask: input.ask })
    .where(eq(people.id, personId))
    .returning({
      teamId: people.teamId,
      location: people.location,
      fact: people.fact,
      ask: people.ask,
    });
  if (!saved) throw new AppError("not_found", "person row missing");

  return {
    teamId: saved.teamId ?? team.id,
    location: saved.location ?? "",
    fact: saved.fact ?? "",
    ask: saved.ask ?? "",
  };
}
