"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { collectStickerSchema } from "../schemas";
import { authorizePlayer } from "../server/authorize-player";
import { collectStickerRecord } from "../server/collect-sticker-record";

export const collectSticker = action({
  name: "games.collectSticker",
  schema: collectStickerSchema,
  authorize: authorizePlayer,
  run: async ({ personId, note }, player) => {
    await collectStickerRecord({
      game: player.game,
      viewerPersonId: player.personId,
      personId,
      note,
    });
    return ok();
  },
  revalidate: ({ personId }) => [
    `${ROUTES.playCollect}/${personId}`,
    ROUTES.play,
    ROUTES.playMission,
  ],
});
