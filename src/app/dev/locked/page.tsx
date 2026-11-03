import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LockedHome } from "@/features/games/components/locked-home";
import { env } from "@/shared/config/env";
import { isCatalogueEnabled } from "@/shared/lib/catalogue-access";

export const metadata: Metadata = {
  title: "Locked home (dev)",
  robots: { index: false, follow: false },
};

const NAV = {
  hasMission: false,
  hasNewClue: false,
  collectedCount: 0,
  total: 0,
  admin: false,
  welcomer: false,
  locked: true,
};

/** What a new hire with no mission sees, for local dev and previews only. */
export default async function LockedPreviewPage() {
  if (!isCatalogueEnabled({ nodeEnv: env.NODE_ENV, vercelEnv: env.NEXT_PUBLIC_VERCEL_ENV })) {
    notFound();
  }
  return <LockedHome nav={NAV} />;
}
