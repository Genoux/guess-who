"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { logger } from "@/shared/lib/logger";
import { createNewHireSchema } from "../schemas";
import { authorizeAdminPerson } from "../server/authorize-admin-person";
import { createNewHireRecord } from "../server/create-new-hire-record";

export const createNewHire = action({
  name: "games.createNewHire",
  schema: createNewHireSchema,
  authorize: authorizeAdminPerson,
  run: async ({ email, startDate }, admin) => {
    const created = await createNewHireRecord({
      email,
      startDate,
      adminPersonId: admin.personId,
      now: new Date(),
    });
    logger.info("new hire added", { gameId: created.gameId, adminPersonId: admin.personId });
    return ok(created);
  },
  revalidate: () => [ROUTES.admin],
});
