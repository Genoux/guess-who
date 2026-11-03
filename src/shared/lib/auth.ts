import "server-only";
import { auth } from "@clerk/nextjs/server";
import { AppError } from "@inbeat/core/errors";
import { cache } from "react";
import { type Role, resolveRole } from "./roles";

export type Viewer = { userId: string; sessionId: string; role: Role };

/** Any signed-in user; who may sign in at all is decided by the Clerk allowlist. */
export const authorizeMember = cache(async (): Promise<Viewer> => {
  const { isAuthenticated, userId, sessionId, sessionClaims } = await auth();
  if (!isAuthenticated) throw new AppError("auth", "no session");
  return { userId, sessionId, role: resolveRole(sessionClaims) };
});

export async function authorizeAdmin(): Promise<Viewer> {
  const viewer = await authorizeMember();
  if (viewer.role !== "admin") throw new AppError("forbidden", "admin role required");
  return viewer;
}
