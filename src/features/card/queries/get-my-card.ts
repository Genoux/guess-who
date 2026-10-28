import "server-only";
import { asc } from "drizzle-orm";
import { teams } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { getViewerPerson } from "@/shared/lib/viewer-person";
import { authorizeCardEditor } from "../server/authorize-card-editor";
import type { MyCard } from "../types";

/** The viewer's own card and the teams to pick from. */
export async function getMyCard(): Promise<MyCard> {
  const { audience } = await authorizeCardEditor();
  const { person } = await getViewerPerson();
  const teamRows = await db
    .select({ id: teams.id, name: teams.name, color: teams.color, tint: teams.tint })
    .from(teams)
    .orderBy(asc(teams.sortOrder), asc(teams.name));

  return {
    name: person.name,
    stickerNumber: person.stickerNumber,
    imageUrl: person.imageUrl,
    audience,
    fields: {
      teamId: person.teamId ?? "",
      location: person.location ?? "",
      fact: person.fact ?? "",
      ask: person.ask ?? "",
    },
    teams: teamRows,
  };
}
