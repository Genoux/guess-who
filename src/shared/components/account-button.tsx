"use client";

import { ClerkLoaded, ClerkLoading, UserButton } from "@clerk/nextjs";
import { motion } from "motion/react";
import { TRANSITION } from "@/shared/components/game/game-motion";

const AVATAR_SIZE = "2.5rem";

/** The signed-in person's picture with Clerk's menu (sign out), top right of every player screen. */
export function AccountButton() {
  return (
    <>
      <ClerkLoading>
        <motion.span
          aria-hidden
          className="block flex-none rounded-full bg-game-hover"
          style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 0.55, 1] }}
          transition={TRANSITION.pulse}
        />
      </ClerkLoading>
      <ClerkLoaded>
        <UserButton
          appearance={{
            // Style objects, not classes: Clerk's unlayered styles beat Tailwind's layered utilities.
            elements: {
              avatarBox: { width: AVATAR_SIZE, height: AVATAR_SIZE },
              userButtonTrigger:
                "rounded-full focus-visible:outline-2 focus-visible:outline-game-found focus-visible:outline-offset-2",
              // Clerk has no prop to drop it. A profile edit there would not reach the game: the
              // name is copied once and the photo comes from Slack.
              userButtonPopoverActionButton__manageAccount: { display: "none" },
            },
          }}
        />
      </ClerkLoaded>
    </>
  );
}
