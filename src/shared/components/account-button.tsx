"use client";

import { UserButton } from "@clerk/nextjs";

/** The signed-in person's picture with Clerk's menu (manage account, sign out), top right of every player screen. */
export function AccountButton() {
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
