export type Role = "admin" | "member";

/**
 * Reads `sessionClaims.metadata.role` (Clerk session claim `{"metadata": "{{user.public_metadata}}"}`).
 * Anything other than an exact "admin" is a member; nothing ever falls back to admin.
 */
export function resolveRole(sessionClaims: unknown): Role {
  if (typeof sessionClaims !== "object" || sessionClaims === null) return "member";
  const { metadata } = sessionClaims as { metadata?: unknown };
  if (typeof metadata !== "object" || metadata === null) return "member";
  return (metadata as { role?: unknown }).role === "admin" ? "admin" : "member";
}
