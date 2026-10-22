"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { updateMyCardSchema } from "../schemas";
import { authorizeCardEditor } from "../server/authorize-card-editor";
import { updateCardRecord } from "../server/update-card-record";

export const updateMyCard = action({
  name: "card.update",
  schema: updateMyCardSchema,
  authorize: authorizeCardEditor,
  run: async (input, editor) => ok(await updateCardRecord(input, editor.personId)),
  revalidate: () => [ROUTES.card],
});
