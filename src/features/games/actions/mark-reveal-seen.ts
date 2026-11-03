"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { markRevealSeenSchema } from "../schemas";
import { authorizePlayer } from "../server/authorize-player";
import { markRevealSeenRecord } from "../server/mark-reveal-seen-record";

export const markRevealSeen = action({
  name: "games.markRevealSeen",
  schema: markRevealSeenSchema,
  authorize: authorizePlayer,
  run: async (_input, player) => {
    await markRevealSeenRecord({
      game: player.game,
      viewerPersonId: player.personId,
      now: new Date(),
    });
    return ok();
  },
  revalidate: () => [ROUTES.play, ROUTES.playMission],
});
