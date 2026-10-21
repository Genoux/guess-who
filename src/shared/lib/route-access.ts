import { ROUTES } from "@/shared/config/routes";

// Clerk's sign-in and sign-up pages are catch-all routes; the rest are single files.
const PUBLIC_SECTIONS = [ROUTES.signIn, ROUTES.signUp];
const PUBLIC_PATHS = ["/api/health", "/robots.txt"];

const isWithin = (pathname: string, section: string) =>
  pathname === section || pathname.startsWith(`${section}/`);

export const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.includes(pathname) || PUBLIC_SECTIONS.some((section) => isWithin(pathname, section));

export const isAdminPath = (pathname: string) => isWithin(pathname, ROUTES.admin);
