"use client";

import { type ExternalToast, Toaster, toast } from "sonner";

const GAME_TOASTER_ID = "game";

/** Mount once inside GameShell; game toasts never land in the admin Toaster. */
export function GameToaster() {
  return (
    <Toaster
      id={GAME_TOASTER_ID}
      position="bottom-center"
      offset={40}
      mobileOffset={24}
      visibleToasts={1}
      containerAriaLabel="Game notifications"
    />
  );
}

/** Shows the ink pill toast ("+1 sticker") at the bottom of the game screen. */
export function gameToast(message: string, options?: Pick<ExternalToast, "duration" | "id">) {
  return toast.custom(
    () => (
      <div className="mx-auto inline-flex h-12 items-center gap-2.5 whitespace-nowrap rounded-full bg-game-ink px-5 font-game-sans font-medium text-button-sm text-white">
        {message}
      </div>
    ),
    {
      duration: 2600,
      ...options,
      toasterId: GAME_TOASTER_ID,
      unstyled: true,
      className: "flex w-full justify-center",
    },
  );
}
