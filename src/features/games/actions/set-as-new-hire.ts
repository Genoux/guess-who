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
  run: async ({ personId }, admin) => {
    await setAsNewHireRecord({ personId });
    logger.info("person set as new hire", { adminPersonId: admin.personId });
    return ok();
  },
  revalidate: () => [ROUTES.admin],
});
