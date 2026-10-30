"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { authorizeAdmin } from "@/shared/lib/auth";
import { logger } from "@/shared/lib/logger";
import { changeInviteEmailSchema } from "../schemas";
import { changeInviteEmailRecord } from "../server/change-invite-email-record";

export const changeInviteEmail = action({
  name: "games.changeInviteEmail",
  schema: changeInviteEmailSchema,
  authorize: authorizeAdmin,
  run: async ({ gameId, email }) => {
    await changeInviteEmailRecord({ gameId, email });
    logger.info("invite email changed", { gameId });
    return ok();
  },
  revalidate: () => [ROUTES.admin],
});
