import "server-only";
import { AppError } from "@inbeat/core/errors";
import { assertNotProduction } from "@/db/assert-not-production";
import { env } from "@/shared/config/env";
import { authorizeMember, type Viewer } from "@/shared/lib/auth";
import { isCatalogueEnabled } from "@/shared/lib/catalogue-access";
import { findPersonByClerkUserId } from "@/shared/lib/person-records";

export type DemoTester = Viewer & { email: string };

/** `authorize` for dev tools that rewrite the signed-in person's own game: dev and previews only. */
export async function authorizeDemoTester(): Promise<DemoTester> {
  if (!isCatalogueEnabled({ nodeEnv: env.NODE_ENV, vercelEnv: env.NEXT_PUBLIC_VERCEL_ENV })) {
    throw new AppError("forbidden", "dev tools are off here");
  }
  assertNotProduction(env.DATABASE_URL);
  const viewer = await authorizeMember();
  const person = await findPersonByClerkUserId(viewer.userId);
  if (!person) throw new AppError("forbidden", "viewer has no person row");
  return { ...viewer, email: person.email };
}
