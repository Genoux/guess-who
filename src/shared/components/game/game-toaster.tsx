"use client";

import { type ExternalToast, Toaster, toast } from "sonner";
import { gameCn } from "./game-cn";

const GAME_TOASTER_ID = "game";

/** Mount once inside GameShell; game toasts never land in the admin Toaster. */
export function GameToaster() {
  return (
    <Toaster
      id={GAME_TOASTER_ID}
      position="top-center"
      offset={24}
      mobileOffset={{ top: "calc(env(safe-area-inset-top) + 16px)", left: 24, right: 24 }}
      visibleToasts={1}
      containerAriaLabel="Game notifications"
    />
  );
}

type GameToastTone = "ink" | "unlock";

const TONE_CLASSES: Record<GameToastTone, string> = {
  ink: "bg-game-ink text-white",
  unlock: "bg-game-shortlist text-game-ink",
};

type GameToastOptions = Pick<ExternalToast, "duration" | "id"> & { tone?: GameToastTone };

/** Shows a pill toast at the top of the game screen: ink by default, yellow for an unlock. */
export function gameToast(message: string, { tone = "ink", ...options }: GameToastOptions = {}) {
  return toast.custom(
    () => (
      <div
        className={gameCn(
          "mx-auto inline-flex h-12 items-center whitespace-nowrap rounded-full px-5 font-game-sans font-medium text-button-sm",
          TONE_CLASSES[tone],
        )}
      >
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
