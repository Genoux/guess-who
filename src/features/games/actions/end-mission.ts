"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { logger } from "@/shared/lib/logger";
import { missionIdSchema } from "../schemas";
import { authorizeAdminPerson } from "../server/authorize-admin-person";
import { removeMissionRecord } from "../server/remove-mission-record";

export const endMission = action({
  name: "games.endMission",
  schema: missionIdSchema,
  authorize: authorizeAdminPerson,
  run: async ({ gameId }) => {
    await removeMissionRecord({ gameId, stage: "playing", now: new Date() });
    logger.info("mission ended", { gameId });
    return ok();
  },
  revalidate: () => [ROUTES.admin, ROUTES.play, ROUTES.playMission, ROUTES.welcomer],
});
