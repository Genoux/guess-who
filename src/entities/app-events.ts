import { z } from "zod";

const personRecipientSchema = z.object({
  personId: z.uuid(),
  name: z.string().min(1),
  email: z.email(),
  slackUserId: z.string().min(1).nullable(),
});

/**
 * Every event the app sends to n8n, by name, with the shape of its data. n8n switches on the
 * name; adding an event is one entry here and one `publishAppEvent` where it happens.
 */
export const APP_EVENT_SCHEMAS = {
  "mission.started": z.object({
    gameId: z.uuid(),
    startDate: z.iso.date(),
    player: personRecipientSchema,
  }),
} as const;

export type AppEventType = keyof typeof APP_EVENT_SCHEMAS;
export type AppEventData<Type extends AppEventType> = z.infer<(typeof APP_EVENT_SCHEMAS)[Type]>;

export function isAppEventType(value: string): value is AppEventType {
  return Object.hasOwn(APP_EVENT_SCHEMAS, value);
}

/** What n8n receives: one envelope for every event. */
export type AppEventEnvelope = {
  id: string;
  type: AppEventType;
  occurredAt: string;
  data: AppEventData<AppEventType>;
};
