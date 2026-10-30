"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { logger } from "@/shared/lib/logger";
import { setAsNewHireSchema } from "../schemas";
import { authorizeAdminPerson } from "../server/authorize-admin-person";
import { setAsNewHireRecord } from "../server/set-as-new-hire-record";

export const setAsNewHire = action({
  name: "games.setAsNewHire",
  schema: setAsNewHireSchema,
  authorize: authorizeAdminPerson,
  run: async ({ personId, startMission }, admin) => {
    const created = await setAsNewHireRecord({
      personId,
      adminPersonId: admin.personId,
      now: new Date(),
      startMission,
    });
    logger.info("person set as new hire", {
      startMission,
      gameId: created.gameId,
      adminPersonId: admin.personId,
    });
    return ok(created);
  },
  revalidate: () => [ROUTES.admin],
});
