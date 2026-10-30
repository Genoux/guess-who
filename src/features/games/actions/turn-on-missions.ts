"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { logger } from "@/shared/lib/logger";
import { turnOnMissionsSchema } from "../schemas";
import { authorizeAdminPerson } from "../server/authorize-admin-person";
import { turnOnMissionsRecord } from "../server/turn-on-missions-record";

export const turnOnMissions = action({
  name: "games.turnOnMissions",
  schema: turnOnMissionsSchema,
  authorize: authorizeAdminPerson,
  run: async ({ personIds }, admin) => {
    const turnedOn = await turnOnMissionsRecord({
      personIds,
      adminPersonId: admin.personId,
      now: new Date(),
    });
    logger.info("missions turned on", { ...turnedOn, adminPersonId: admin.personId });
    return ok(turnedOn);
  },
  revalidate: () => [ROUTES.admin, ROUTES.play, ROUTES.playMission],
});
