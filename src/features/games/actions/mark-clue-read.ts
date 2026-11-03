"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { markClueReadSchema } from "../schemas";
import { authorizePlayer } from "../server/authorize-player";
import { markClueReadRecord } from "../server/mark-clue-read-record";

export const markClueRead = action({
  name: "games.markClueRead",
  schema: markClueReadSchema,
  authorize: authorizePlayer,
  run: async ({ number }, player) => {
    await markClueReadRecord({
      game: player.game,
      viewerPersonId: player.personId,
      number,
      now: new Date(),
    });
    return ok();
  },
  revalidate: () => [ROUTES.play, ROUTES.playMission],
});
