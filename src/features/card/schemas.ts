import { z } from "zod";
import { CARD_LIMITS } from "@/entities/card";

const cardText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Keep it to ${max} characters.` });

/**
 * The only fields a teammate writes. Name, team and location come from Deel, so a payload that
 * carries them is stripped here. Drafts save: `isCardComplete` decides what a blank field costs.
 */
export const updateMyCardSchema = z.object({
  fact: cardText(CARD_LIMITS.fact),
  ask: cardText(CARD_LIMITS.ask),
});

export type UpdateMyCardInput = z.output<typeof updateMyCardSchema>;
