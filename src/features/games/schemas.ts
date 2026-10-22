import { z } from "zod";

export const NOTE_MAX = 280;
export const CLUE_MAX = 160;

export const collectStickerSchema = z.object({
  personId: z.uuid(),
  note: z
    .string()
    .trim()
    .min(1, "Write one thing you learned.")
    .max(NOTE_MAX, `Keep it under ${NOTE_MAX} characters.`),
});

export const shortlistSchema = z.object({ personId: z.uuid(), on: z.boolean() });

export const guessWelcomerSchema = z.object({ personId: z.uuid() });

export const markClueReadSchema = z.object({
  number: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});

export const markIntroSeenSchema = z.object({});

export const writeClueSchema = z.object({
  number: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  text: z
    .string()
    .trim()
    .min(1, "Write a clue first.")
    .max(CLUE_MAX, `Keep it under ${CLUE_MAX} characters.`),
});
