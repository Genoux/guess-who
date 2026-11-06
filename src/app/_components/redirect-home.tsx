"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROUTES } from "@/shared/config/routes";

/** Sends a browser that landed on an unknown URL to the home screen. */
export function RedirectHome() {
  const router = useRouter();
  useEffect(() => router.replace(ROUTES.home), [router]);
  return null;
}
