import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WelcomerHome } from "@/features/games/components/welcomer-home";
import { DEV_TOP_NAV } from "@/features/games/lib/dev-state";
import { env } from "@/shared/config/env";
import { isCatalogueEnabled } from "@/shared/lib/catalogue-access";

export const metadata: Metadata = {
  title: "Welcomer (dev)",
  robots: { index: false, follow: false },
};

/** The welcomer's ink page with a sample new hire, for local dev and previews only. */
export default function WelcomerPreviewPage() {
  if (!isCatalogueEnabled({ nodeEnv: env.NODE_ENV, vercelEnv: env.NEXT_PUBLIC_VERCEL_ENV })) {
    notFound();
  }

  return <WelcomerHome playerFirstName="Léa" cluesSet={false} nav={DEV_TOP_NAV} />;
}
