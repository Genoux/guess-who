"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { markIntroSeenSchema } from "../schemas";
import { authorizePlayer } from "../server/authorize-player";
import { markIntroSeenRecord } from "../server/mark-intro-seen-record";

export const markIntroSeen = action({
  name: "games.markIntroSeen",
  schema: markIntroSeenSchema,
  authorize: authorizePlayer,
  run: async (_input, player) => {
    await markIntroSeenRecord({
      game: player.game,
      viewerPersonId: player.personId,
      now: new Date(),
    });
    return ok();
  },
  revalidate: () => [ROUTES.play, ROUTES.playMission, ROUTES.playWelcome],
});
