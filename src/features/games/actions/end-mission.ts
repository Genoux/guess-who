"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { authorizeAdmin } from "@/shared/lib/auth";
import { logger } from "@/shared/lib/logger";
import { endMissionSchema } from "../schemas";
import { endMissionRecord } from "../server/end-mission-record";

export const endMission = action({
  name: "games.endMission",
  schema: endMissionSchema,
  authorize: authorizeAdmin,
  run: async ({ gameId }) => {
    await endMissionRecord({ gameId, now: new Date() });
    logger.info("mission ended", { gameId });
    return ok();
  },
  revalidate: () => [ROUTES.admin, ROUTES.play, ROUTES.playMission, ROUTES.welcomer],
});
