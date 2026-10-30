import { ClerkProvider } from "@clerk/nextjs";
import { fontVariables } from "@inbeat/next/fonts";
import { Toaster } from "@inbeat/ui/components/sonner";
import { Spinner } from "@inbeat/ui/components/spinner";
import { TooltipProvider } from "@inbeat/ui/components/tooltip";
import type { Metadata, Viewport } from "next";
import { type ReactNode, Suspense } from "react";
import { DevPanel } from "@/features/games/components/dev-panel";
import { env } from "@/shared/config/env";
import { ROUTES } from "@/shared/config/routes";
import { isCatalogueEnabled } from "@/shared/lib/catalogue-access";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "The Album", template: "%s | The Album" },
  description: "Collect your teammates' stickers and find your secret welcomer.",
};

// The nav bar is the game surface, so the browser chrome matches it.
export const viewport: Viewport = { viewportFit: "cover", themeColor: "#ffffff" };

function PageSpinner() {
  return (
    <main className="flex min-h-dvh items-center justify-center">
      <Spinner />
    </main>
  );
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-dvh min-w-app-min font-sans antialiased">
        <ClerkProvider signInUrl={ROUTES.signIn} signUpUrl={ROUTES.signUp}>
          <TooltipProvider>
            <Toaster
              position="top-center"
              mobileOffset={{ top: "calc(env(safe-area-inset-top) + 16px)" }}
            />
            {/* One boundary above every route, not a loading.tsx: it shows the spinner on the first
                load only. A navigation is a transition, so React keeps the current screen up until
                the next one is ready, and GameShell's ViewTransition dissolves one into the other. */}
            <Suspense fallback={<PageSpinner />}>{children}</Suspense>
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
