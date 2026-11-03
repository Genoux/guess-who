"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { logger } from "@/shared/lib/logger";
import { addNewHireSchema } from "../schemas";
import { addNewHireRecord } from "../server/add-new-hire-record";
import { authorizeAdminPerson } from "../server/authorize-admin-person";

export const addNewHire = action({
  name: "games.addNewHire",
  schema: addNewHireSchema,
  authorize: authorizeAdminPerson,
  run: async ({ email }, admin) => {
    const added = await addNewHireRecord({
      email,
      adminPersonId: admin.personId,
      now: new Date(),
    });
    logger.info("new hire added", { ...added, adminPersonId: admin.personId });
    return ok(added);
  },
  revalidate: () => [ROUTES.admin, ROUTES.play, ROUTES.playMission],
});
