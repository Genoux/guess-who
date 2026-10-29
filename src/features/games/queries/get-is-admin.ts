import "server-only";
import { getViewerPerson } from "@/shared/lib/viewer-person";

/** Whether the viewer is an admin: it adds the New hires tab. */
export async function getIsAdmin(): Promise<boolean> {
  return (await getViewerPerson()).role === "admin";
}
