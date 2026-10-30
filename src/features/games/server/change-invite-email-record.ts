import "server-only";
import { AppError } from "@inbeat/core/errors";
import { and, eq, isNull, sql } from "drizzle-orm";
import { games, people } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { findPersonByEmail } from "@/shared/lib/person-records";
import { lockMissionStarts, welcomesEachOther } from "./begin-mission-record";
import { findGameById } from "./game-records";
import { toMissionWriteError } from "./mission-email";

type ChangeInviteEmailInput = {
  gameId: string;
  /** Normalized. */
  email: string;
};

const LOCKED = "The email is locked once they've signed in.";

const localPart = (email: string) => email.split("@")[0] ?? email;

/**
 * Fixes the email of an invite until its player signs in, on the game and on the person row that
 * adding them pre-created, in one transaction. If the new email already belongs to a person, the
 * placeholder row goes and that person becomes the new hire, unless they are the mission's welcomer
 * or already welcome its welcomer.
 */
export async function changeInviteEmailRecord({ gameId, email }: ChangeInviteEmailInput) {
  const game = await findGameById(gameId);
  if (!game) throw new AppError("not_found", "game missing");
  if (game.playerPersonId !== null) {
    throw new AppError("forbidden", "email is locked once the player signed in", {
      safeMessage: LOCKED,
    });
  }
  const existing = await findPersonByEmail(email);
  const placeholder = and(eq(people.email, game.playerEmail), isNull(people.clerkUserId));

  try {
    await db.transaction(async (tx) => {
      if (existing) {
        await lockMissionStarts(tx);
        if (existing.id === game.welcomerPersonId) {
          throw new AppError("conflict", "new player is the welcomer", {
            safeMessage: "They're this mission's welcomer.",
          });
        }
        if (
          await welcomesEachOther(tx, {
            playerPersonId: existing.id,
            welcomerPersonId: game.welcomerPersonId,
          })
        ) {
          throw new AppError("conflict", "mutual welcoming", {
            safeMessage: "They already welcome this mission's welcomer.",
          });
        }
        await tx.delete(people).where(placeholder);
        await tx.update(people).set({ newHire: true }).where(eq(people.id, existing.id));
      } else {
        await tx
          .update(people)
          .set({
            email,
            name: sql`case when ${people.name} = ${localPart(game.playerEmail)} then ${localPart(email)} else ${people.name} end`,
          })
          .where(placeholder);
      }
      const [updated] = await tx
        .update(games)
        .set({ playerEmail: email, playerPersonId: existing?.clerkUserId ? existing.id : null })
        .where(and(eq(games.id, gameId), isNull(games.playerPersonId)))
        .returning({ id: games.id });
      if (!updated) {
        throw new AppError("forbidden", "player signed in since it was read", {
          safeMessage: LOCKED,
        });
      }
    });
  } catch (err) {
    throw toMissionWriteError(err);
  }
}
