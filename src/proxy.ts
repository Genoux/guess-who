import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ROUTES } from "@/shared/config/routes";
import { resolveRole } from "@/shared/lib/roles";
import { isAdminPath, isPublicPath } from "@/shared/lib/route-access";

// Optimistic gate only: every page, action and route checks access again on the server.
export default clerkMiddleware(
  async (auth, request) => {
    const { pathname } = request.nextUrl;
    if (isPublicPath(pathname)) return;
    const { sessionClaims } = await auth.protect();
    if (isAdminPath(pathname) && resolveRole(sessionClaims) !== "admin") {
      return NextResponse.redirect(new URL(ROUTES.home, request.url));
    }
  },
  { signInUrl: ROUTES.signIn, signUpUrl: ROUTES.signUp },
);

export const config = {
  matcher: [
    // Skips Next internals, static files and the Sentry tunnel (/monitoring).
    "/((?!_next|monitoring|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
