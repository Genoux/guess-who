import { normalizeEmail } from "@inbeat/core/email";
import { z } from "zod";
import { DEV_SCENARIO_IDS } from "./lib/dev-state";

export const NOTE_MAX = 1000;
export const CLUE_MAX = 160;

const noteText = z
  .string()
  .trim()
  .min(1, "Write one thing you learned.")
  .max(NOTE_MAX, `Keep it under ${NOTE_MAX} characters.`);

export const collectStickerSchema = z.object({ personId: z.uuid(), note: noteText });

export const saveNoteSchema = z.object({ personId: z.uuid(), note: noteText });

export const shortlistSchema = z.object({ personId: z.uuid(), on: z.boolean() });

export const guessWelcomerSchema = z.object({ personId: z.uuid() });

export const markClueReadSchema = z.object({
  number: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});

export const markIntroSeenSchema = z.object({});

export const markRevealSeenSchema = z.object({});

export const writeClueSchema = z.object({
  number: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  text: z
    .string()
    .trim()
    .min(1, "Write a clue first.")
    .max(CLUE_MAX, `Keep it under ${CLUE_MAX} characters.`),
});

export const devStateSchema = z.object({ scenario: z.enum(DEV_SCENARIO_IDS) });

const newHireEmail = z
  .string()
  .trim()
  .pipe(z.email({ error: "Enter their email." }))
  .transform(normalizeEmail);

const firstDay = z.iso.date({ error: "Pick the first day." });

export const createNewHireSchema = z.object({ email: newHireEmail, startDate: firstDay });

export const updateNewHireSchema = createNewHireSchema.extend({
  gameId: z.uuid(),
  welcomerPersonId: z.uuid().optional(),
});

export const removeNewHireSchema = z.object({ gameId: z.uuid() });
