import type { clues, collections, games } from "@/db/schema";
import type { Role } from "@/shared/lib/roles";

export type Game = typeof games.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type ClueRow = typeof clues.$inferSelect;

/** One of the four clues as the game shows it; clue 1 is generated and has no row. */
export type Clue = Omit<ClueRow, "text"> & { text: string | null; releaseAt: Date };

export type GameViewer = { personId: string; role: Role };
