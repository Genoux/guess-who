"use client";

import { GameButton } from "@/shared/components/game/game-button";
import { gameToast } from "@/shared/components/game/game-toaster";

export function ToastDemo() {
  return (
    <GameButton size="sm" variant="light" onClick={() => gameToast("+1 sticker")}>
      Show toast
    </GameButton>
  );
}
