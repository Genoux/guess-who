import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@inbeat/ui/components/button";
import { ROUTES } from "@/shared/config/routes";

// Deliberately reads nothing: getViewerPerson redirects here when it refuses the viewer.
export default function NotOnTheListPage() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <h1 className="text-lg font-medium">You're not on the list yet</h1>
        <p className="text-sm text-muted-foreground">Ask People Strategy, then sign in again.</p>
        <SignOutButton redirectUrl={ROUTES.signIn}>
          <Button variant="outline">Sign out</Button>
        </SignOutButton>
      </div>
    </main>
  );
}
