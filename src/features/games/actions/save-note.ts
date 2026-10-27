"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { saveNoteSchema } from "../schemas";
import { authorizePlayer } from "../server/authorize-player";
import { saveNoteRecord } from "../server/save-note-record";

export const saveNote = action({
  name: "games.saveNote",
  schema: saveNoteSchema,
  authorize: authorizePlayer,
  run: async ({ personId, note }, player) => {
    await saveNoteRecord({ game: player.game, viewerPersonId: player.personId, personId, note });
    return ok();
  },
  revalidate: ({ personId }) => [`${ROUTES.playCollect}/${personId}`, ROUTES.play],
});
