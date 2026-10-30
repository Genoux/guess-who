import "server-only";
import { eq } from "drizzle-orm";
import { games } from "@/db/schema";
import { assertCardUnlocked } from "@/shared/lib/card-access";
import { db } from "@/shared/lib/db";
import { getViewerPerson } from "@/shared/lib/viewer-person";
import type { CardAudience } from "../types";
import { cardAudience } from "./card-audience";

export type CardEditor = { personId: string; audience: CardAudience };

/** The signed-in person, who only ever edits their own card: the id comes from the session. */
export async function authorizeCardEditor(): Promise<CardEditor> {
  const { person } = await getViewerPerson();
  await assertCardUnlocked(person);
  const played = await db
    .select({ status: games.status })
    .from(games)
    .where(eq(games.playerPersonId, person.id));
  return {
    personId: person.id,
    audience: cardAudience(played.map((game) => game.status)),
  };
}
