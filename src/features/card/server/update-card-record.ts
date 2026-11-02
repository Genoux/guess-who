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

async function assertTeamExists(teamId: string) {
  const [team] = await db.select({ id: teams.id }).from(teams).where(eq(teams.id, teamId)).limit(1);
  if (!team) {
    throw new AppError("validation", "unknown team", { safeMessage: "Pick your team." });
  }
}

/**
 * Saves the person's own sticker fields; a supplied team must exist. A draft saves, except while
 * they welcome a started mission: their card has to stay complete for the player. A missing team
 * keeps the one they have, since the form can only change it, never clear it.
 */
export async function updateCardRecord(
  input: UpdateMyCardInput,
  personId: string,
  now: Date,
): Promise<CardFields> {
  if (!isCardComplete(input) && (await findActiveWelcomerGame(personId, now))) {
    throw new AppError("forbidden", "card must stay complete while their mission is playing", {
      safeMessage: WELCOMING_LOCKED_MESSAGE,
    });
  }
  if (input.teamId) await assertTeamExists(input.teamId);

  const [saved] = await db
    .update(people)
    .set({
      teamId: input.teamId ?? undefined,
      location: input.location || null,
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
