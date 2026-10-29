"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { writeClueSchema } from "../schemas";
import { authorizeTeammate } from "../server/authorize-teammate";
import { writeClueRecord } from "../server/write-clue-record";

export const writeClue = action({
  name: "games.writeClue",
  schema: writeClueSchema,
  authorize: authorizeTeammate,
  run: async ({ number, text }, teammate) => {
    await writeClueRecord({ personId: teammate.personId, number, text, now: new Date() });
    return ok();
  },
  revalidate: () => [ROUTES.clues, ROUTES.welcomer],
});
