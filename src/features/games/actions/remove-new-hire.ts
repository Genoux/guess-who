"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { authorizeAdmin } from "@/shared/lib/auth";
import { logger } from "@/shared/lib/logger";
import { removeNewHireSchema } from "../schemas";
import { removeNewHireRecord } from "../server/remove-new-hire-record";

export const removeNewHire = action({
  name: "games.removeNewHire",
  schema: removeNewHireSchema,
  authorize: authorizeAdmin,
  run: async ({ gameId }) => {
    await removeNewHireRecord({ gameId, now: new Date() });
    logger.info("new hire removed", { gameId });
    return ok();
  },
  revalidate: () => [ROUTES.admin],
});
