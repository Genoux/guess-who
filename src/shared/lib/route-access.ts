import { ROUTES } from "@/shared/config/routes";

// Clerk's sign-in and sign-up pages are catch-all routes; the rest are single files.
// The dev pages are public here but 404 outside development and previews.
const PUBLIC_SECTIONS = [
  ROUTES.signIn,
  ROUTES.signUp,
  ROUTES.devComponents,
  ROUTES.devWelcome,
  ROUTES.devAlbum,
  ROUTES.devMission,
  ROUTES.devWelcomer,
];
const PUBLIC_PATHS = ["/api/health", "/robots.txt"];

const isWithin = (pathname: string, section: string) =>
  pathname === section || pathname.startsWith(`${section}/`);

export const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.includes(pathname) || PUBLIC_SECTIONS.some((section) => isWithin(pathname, section));

export const isAdminPath = (pathname: string) => isWithin(pathname, ROUTES.admin);
