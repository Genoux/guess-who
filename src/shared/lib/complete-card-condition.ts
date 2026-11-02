import "server-only";
import { and, isNotNull, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { people } from "@/db/schema";

const isFilled = (column: AnyPgColumn) => sql`btrim(coalesce(${column}, '')) <> ''`;

/** `isCardComplete` in SQL; keep the two in step. */
export const completeCardCondition = and(
  isNotNull(people.teamId),
  isFilled(people.location),
  isFilled(people.fact),
  isFilled(people.ask),
);
