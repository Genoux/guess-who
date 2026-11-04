"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { logger } from "@/shared/lib/logger";
import { endMissionSchema } from "../schemas";
import { authorizeAdminPerson } from "../server/authorize-admin-person";
import { endMissionRecord } from "../server/end-mission-record";

export const endMission = action({
  name: "games.endMission",
  schema: endMissionSchema,
  authorize: authorizeAdminPerson,
  run: async ({ gameId }) => {
    await endMissionRecord({ gameId, now: new Date() });
    logger.info("mission ended", { gameId });
    return ok();
  },
  revalidate: () => [ROUTES.admin, ROUTES.play, ROUTES.playMission, ROUTES.welcomer],
});
