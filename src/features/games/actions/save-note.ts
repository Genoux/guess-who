"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { saveNoteSchema } from "../schemas";
import { authorizeCollector } from "../server/authorize-collector";
import { saveNoteRecord } from "../server/save-note-record";

export const saveNote = action({
  name: "games.saveNote",
  schema: saveNoteSchema,
  authorize: authorizeCollector,
  run: async ({ personId, note }, teammate) => {
    await saveNoteRecord({ viewerPersonId: teammate.personId, personId, note });
    return ok();
  },
  revalidate: ({ personId }) => [`${ROUTES.playCollect}/${personId}`, ROUTES.play],
});
