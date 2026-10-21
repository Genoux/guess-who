import "server-only";
import { createDb } from "@inbeat/next/db";
import * as schema from "@/db/schema";
import { env } from "@/shared/config/env";

export const { db } = createDb({ url: env.DATABASE_URL, schema, globalKey: "albumDbPool" });
