import { Button } from "@inbeat/ui/components/button";
import Link from "next/link";
import { ROUTES } from "@/shared/config/routes";
import { RedirectHome } from "./_components/redirect-home";

// The redirect runs in the browser: a server redirect or a headers() check made this page dynamic
// and answered 200, while a webhook or fetch to an unknown URL must still get a 404.
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <RedirectHome />
      <h1 className="text-2xl font-medium">Page not found</h1>
      <Button variant="outline" asChild>
        <Link href={ROUTES.home}>Back home</Link>
      </Button>
    </main>
  );
}
