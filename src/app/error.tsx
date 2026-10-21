"use client";

import { Button } from "@inbeat/ui/components/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

// `error.message` is never rendered: in production it is Next's generic copy, and in dev it can
// carry internals. The digest is enough for support to find the server log.
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="text-2xl font-medium">Something went wrong</h1>
      {error.digest ? (
        <p className="font-mono text-xs text-muted-foreground">{error.digest}</p>
      ) : null}
      <Button type="button" variant="outline" onClick={reset} className="mt-6">
        Try again
      </Button>
    </main>
  );
}
