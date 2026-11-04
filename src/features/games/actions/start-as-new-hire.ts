"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { logger } from "@/shared/lib/logger";
import { startAsNewHireSchema } from "../schemas";
import { authorizeAdminPerson } from "../server/authorize-admin-person";
import { startAsNewHireRecord } from "../server/start-as-new-hire-record";

export const startAsNewHire = action({
  name: "games.startAsNewHire",
  schema: startAsNewHireSchema,
  authorize: authorizeAdminPerson,
  run: async ({ personId }, admin) => {
    const started = await startAsNewHireRecord({
      personId,
      adminPersonId: admin.personId,
      now: new Date(),
    });
    logger.info("person started as new hire", { ...started, adminPersonId: admin.personId });
    return ok(started);
  },
  revalidate: () => [ROUTES.admin, ROUTES.play, ROUTES.playMission],
});
