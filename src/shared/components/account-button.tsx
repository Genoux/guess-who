"use client";

import { UserButton } from "@clerk/nextjs";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** The signed-in person's picture with Clerk's menu (manage account, sign out), top right of every player screen. */
export function AccountButton() {
  // Clerk renders the button only in the browser; a same-size placeholder keeps the server HTML equal.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  if (!mounted) return <span aria-hidden className="block size-10 rounded-full bg-game-hover" />;
  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: "size-10",
          userButtonTrigger:
            "rounded-full focus-visible:outline-2 focus-visible:outline-game-found focus-visible:outline-offset-2",
        },
      }}
    />
  );
}
