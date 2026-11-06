import { Button } from "@inbeat/ui/components/button";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ROUTES } from "@/shared/config/routes";

// Only a browser opening a page goes home; a webhook or fetch to an unknown URL still gets a 404,
// so a sender like Deel logs the failure instead of following a redirect to sign-in.
export default async function NotFound() {
  if ((await headers()).get("sec-fetch-dest") === "document") redirect(ROUTES.home);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-medium">Page not found</h1>
      <Button variant="outline" asChild>
        <Link href={ROUTES.home}>Back home</Link>
      </Button>
    </main>
  );
}
