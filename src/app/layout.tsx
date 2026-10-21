import { fontVariables } from "@inbeat/next/fonts";
import { Toaster } from "@inbeat/ui/components/sonner";
import { TooltipProvider } from "@inbeat/ui/components/tooltip";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "inBeat app",
  description: "Built on the inBeat toolkit",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-screen font-sans antialiased">
        <TooltipProvider>
          <Toaster position="top-center" />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
