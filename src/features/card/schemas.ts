import { z } from "zod";

export const CARD_LIMITS = { location: 60, fact: 140, ask: 80 } as const;

const cardText = (max: number, empty: string) =>
  z
    .string()
    .trim()
    .min(1, { error: empty })
    .max(max, { error: `Keep it to ${max} characters.` });

/** The teammate's own sticker; shared by the form and the action. */
export const updateMyCardSchema = z.object({
  teamId: z.uuid({ error: "Pick your team." }),
  location: cardText(CARD_LIMITS.location, "Add where you're based."),
  fact: cardText(CARD_LIMITS.fact, "Add a random fact."),
  ask: cardText(CARD_LIMITS.ask, "Add something to ask you about."),
});

export type UpdateMyCardInput = z.output<typeof updateMyCardSchema>;
