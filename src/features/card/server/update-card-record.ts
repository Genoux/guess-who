import "server-only";
import { AppError } from "@inbeat/core/errors";
import { eq } from "drizzle-orm";
import { people, teams } from "@/db/schema";
import { isCardComplete } from "@/entities/card";
import { WELCOMING_LOCKED_MESSAGE } from "@/entities/new-hire";
import { db } from "@/shared/lib/db";
import { findActiveWelcomerGame } from "@/shared/lib/find-active-welcomer-game";
import type { UpdateMyCardInput } from "../schemas";
import type { CardFields } from "../types";

/**
 * Saves the person's team, fact and ask. Location comes from Deel and is never written here. A
 * draft saves, except while they welcome a started mission: their card has to stay complete for
 * the player.
 */
export async function updateCardRecord(
  input: UpdateMyCardInput,
  personId: string,
  now: Date,
): Promise<CardFields> {
  const [deelFields] = await db
    .select({ location: people.location })
    .from(people)
    .where(eq(people.id, personId))
    .limit(1);
  if (!deelFields) throw new AppError("not_found", "person row missing");

  if (
    !isCardComplete({ ...deelFields, ...input }) &&
    (await findActiveWelcomerGame(personId, now))
  ) {
    throw new AppError("forbidden", "card must stay complete while their mission is playing", {
      safeMessage: WELCOMING_LOCKED_MESSAGE,
    });
  }

  if (input.teamId) {
    const [team] = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.id, input.teamId))
      .limit(1);
    if (!team) throw new AppError("validation", "unknown team", { safeMessage: "Pick your team." });
  }

  const [saved] = await db
    .update(people)
    .set({
      teamId: input.teamId,
      fact: input.fact || null,
      ask: input.ask || null,
    })
    .where(eq(people.id, personId))
    .returning({
      teamId: people.teamId,
      location: people.location,
      fact: people.fact,
      ask: people.ask,
    });
  if (!saved) throw new AppError("not_found", "person row missing");

  return {
    teamId: saved.teamId,
    location: saved.location ?? "",
    fact: saved.fact ?? "",
    ask: saved.ask ?? "",
  };
}
