"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { authorizeAdmin } from "@/shared/lib/auth";
import { logger } from "@/shared/lib/logger";
import { updateNewHireSchema } from "../schemas";
import { updateNewHireRecord } from "../server/update-new-hire-record";

export const updateNewHire = action({
  name: "games.updateNewHire",
  schema: updateNewHireSchema,
  authorize: authorizeAdmin,
  run: async ({ gameId, email, startDate, welcomerPersonId }) => {
    await updateNewHireRecord({ gameId, email, startDate, welcomerPersonId, now: new Date() });
    logger.info("new hire updated", { gameId });
    return ok();
  },
  revalidate: () => [ROUTES.admin],
});
