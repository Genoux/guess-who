"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { shortlistSchema } from "../schemas";
import { authorizePlayer } from "../server/authorize-player";
import { setShortlistRecord } from "../server/set-shortlist-record";

export const setShortlist = action({
  name: "games.setShortlist",
  schema: shortlistSchema,
  authorize: authorizePlayer,
  run: async ({ personId, on }, player) => {
    await setShortlistRecord({ game: player.game, viewerPersonId: player.personId, personId, on });
    return ok();
  },
  revalidate: ({ personId }) => [
    `${ROUTES.playCollect}/${personId}`,
    ROUTES.play,
    ROUTES.playMission,
  ],
});
