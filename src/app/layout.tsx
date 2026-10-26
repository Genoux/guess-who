import { ClerkProvider } from "@clerk/nextjs";
import { fontVariables } from "@inbeat/next/fonts";
import { Toaster } from "@inbeat/ui/components/sonner";
import { TooltipProvider } from "@inbeat/ui/components/tooltip";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DevPanel } from "@/features/games/components/dev-panel";
import { env } from "@/shared/config/env";
import { ROUTES } from "@/shared/config/routes";
import { isCatalogueEnabled } from "@/shared/lib/catalogue-access";
import "./globals.css";

export const metadata: Metadata = {
  title: "inBeat app",
  description: "Built on the inBeat toolkit",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-screen font-sans antialiased">
        <ClerkProvider signInUrl={ROUTES.signIn} signUpUrl={ROUTES.signUp}>
          <TooltipProvider>
            <Toaster position="top-center" />
            {children}
            {isCatalogueEnabled({
              nodeEnv: env.NODE_ENV,
              vercelEnv: env.NEXT_PUBLIC_VERCEL_ENV,
            }) ? (
              <DevPanel />
            ) : null}
          </TooltipProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
