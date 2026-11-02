"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { logger } from "@/shared/lib/logger";
import { removePersonSchema } from "../schemas";
import { authorizeAdminPerson } from "../server/authorize-admin-person";
import { removePersonRecord } from "../server/remove-person-record";

export const removePerson = action({
  name: "games.removePerson",
  schema: removePersonSchema,
  authorize: authorizeAdminPerson,
  run: async ({ personId }, admin) => {
    await removePersonRecord({ personId, actorPersonId: admin.personId, now: new Date() });
    logger.info("person removed", { personId, adminPersonId: admin.personId });
    return ok();
  },
  revalidate: () => [ROUTES.admin, ROUTES.play, ROUTES.playMission, ROUTES.welcomer],
});
