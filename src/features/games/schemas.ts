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

const playerEmail = z
  .string()
  .trim()
  .pipe(z.email({ error: "Enter their email." }))
  .transform(normalizeEmail);

export const addNewHireSchema = z.object({ email: playerEmail });

export const changeInviteEmailSchema = z.object({ gameId: z.uuid(), email: playerEmail });

export const setAsNewHireSchema = z.object({ personId: z.uuid(), startMission: z.boolean() });

export const endMissionSchema = z.object({ gameId: z.uuid() });

/** More than the team has people today; a guard against an absurd request, not a product limit. */
export const TURN_ON_MISSIONS_MAX = 500;

export const turnOnMissionsSchema = z.object({
  personIds: z
    .array(z.uuid())
    .min(1, "Pick at least one person.")
    .max(TURN_ON_MISSIONS_MAX)
    .transform((ids) => [...new Set(ids)]),
});
