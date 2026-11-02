import { z } from "zod";
import { CARD_LIMITS } from "@/entities/card";

const cardText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Keep it to ${max} characters.` });

/** The teammate's own sticker. Drafts save: `isCardComplete` decides what a blank field costs. */
export const updateMyCardSchema = z.object({
  teamId: z.uuid({ error: "Pick your team." }).nullable(),
  location: cardText(CARD_LIMITS.location),
  fact: cardText(CARD_LIMITS.fact),
  ask: cardText(CARD_LIMITS.ask),
});

export type UpdateMyCardInput = z.output<typeof updateMyCardSchema>;
