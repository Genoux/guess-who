"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { collectStickerSchema } from "../schemas";
import { authorizeCollector } from "../server/authorize-collector";
import { collectStickerRecord } from "../server/collect-sticker-record";

export const collectSticker = action({
  name: "games.collectSticker",
  schema: collectStickerSchema,
  authorize: authorizeCollector,
  run: async ({ personId, note }, teammate) => {
    await collectStickerRecord({
      viewerPersonId: teammate.personId,
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
