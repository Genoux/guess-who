import { Button } from "@inbeat/ui/components/button";
import Link from "next/link";
import { ROUTES } from "@/shared/config/routes";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-medium">Page not found</h1>
      <Button variant="outline" asChild>
        <Link href={ROUTES.home}>Back home</Link>
      </Button>
    </main>
  );
}
