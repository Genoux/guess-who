import type { clues, collections, games, people } from "@/db/schema";
import type { Role } from "@/shared/lib/roles";

export type Game = typeof games.$inferSelect;
export type Clue = typeof clues.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type Person = typeof people.$inferSelect;

export type GameViewer = { personId: string; role: Role };
