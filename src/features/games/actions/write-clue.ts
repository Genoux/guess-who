"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { writeClueSchema } from "../schemas";
import { authorizeClueWriter } from "../server/authorize-clue-writer";
import { writeClueRecord } from "../server/write-clue-record";

export const writeClue = action({
  name: "games.writeClue",
  schema: writeClueSchema,
  authorize: authorizeClueWriter,
  run: async ({ number, text }, teammate) => {
    await writeClueRecord({ personId: teammate.personId, number, text, now: new Date() });
    return ok();
  },
  revalidate: () => [ROUTES.clues, ROUTES.welcomer],
});
