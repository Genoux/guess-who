import "server-only";
import { AppError } from "@inbeat/core/errors";
import { and, eq, isNull } from "drizzle-orm";
import { games } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { canEditEmail } from "../lib/new-hire-progress";
import { assertCanChangeWelcomer } from "./assert-can-change-welcomer";
import { assertCanEditNewHire } from "./assert-can-edit-new-hire";
import { assertCanMoveFirstDay } from "./assert-can-move-first-day";
import { findGameById } from "./game-records";
import { assertNotWelcoming, findSignedInPersonId, toNewHireWriteError } from "./new-hire-email";

type UpdateNewHireInput = {
  gameId: string;
  /** Normalized. */
  email: string;
  startDate: string;
  /** A new welcomer; each teammate keeps their own clues. */
  welcomerPersonId?: string;
  now: Date;
};

const NOT_EDITABLE = "This game can't be edited anymore.";

/** Fixes the email, and the first day until the game starts, of a game nobody has signed in to. */
export async function updateNewHireRecord({
  gameId,
  email,
  startDate,
  welcomerPersonId,
  now,
}: UpdateNewHireInput) {
  const game = await findGameById(gameId);
  if (!game) throw new AppError("not_found", "game missing");
  assertCanEditNewHire(game, now);
  const emailChanged = email !== game.playerEmail;
  if (emailChanged && !canEditEmail(game)) {
    throw new AppError("forbidden", "email is locked once the player signed in", {
      safeMessage: "The email is locked once they've signed in.",
    });
  }
  if (startDate !== game.startDate) assertCanMoveFirstDay(game.startDate, startDate, now);
  const welcomerChanged =
    welcomerPersonId !== undefined && welcomerPersonId !== game.welcomerPersonId;
  // shortcut: eligibility is read before the write, the same ceiling as the welcomer pick when
  // adding; a partial unique index on games(welcomer_person_id) where status = 'active' closes it.
  if (welcomerChanged) {
    await assertCanChangeWelcomer({ game, email, welcomerPersonId, now });
  }
  if (emailChanged) await assertNotWelcoming(email, now);
  const playerPersonId = emailChanged ? await findSignedInPersonId(email) : null;

  try {
    const [updated] = await db
      .update(games)
      .set({
        startDate,
        ...(emailChanged && { playerEmail: email, playerPersonId }),
        ...(welcomerChanged && { welcomerPersonId }),
      })
      .where(
        and(
          eq(games.id, gameId),
          eq(games.status, "active"),
          emailChanged ? isNull(games.playerPersonId) : undefined,
        ),
      )
      .returning({ id: games.id });
    if (!updated) {
      throw new AppError("forbidden", "game changed since it was read", {
        safeMessage: NOT_EDITABLE,
      });
    }
  } catch (err) {
    throw toNewHireWriteError(err);
  }
}
