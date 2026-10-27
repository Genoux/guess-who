"use client";

import { GameButton } from "@/shared/components/game/game-button";
import { gameToast } from "@/shared/components/game/game-toaster";

export function ToastDemo() {
  return (
    <div className="flex gap-3">
      <GameButton size="sm" variant="light" onClick={() => gameToast("Saved")}>
        Show toast
      </GameButton>
      <GameButton
        size="sm"
        variant="light"
        onClick={() => gameToast("New sticker unlocked: Noor", { tone: "unlock" })}
      >
        Show unlock toast
      </GameButton>
    </div>
  );
}
