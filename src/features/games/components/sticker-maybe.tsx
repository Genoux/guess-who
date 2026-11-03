"use client";

import { useId, useOptimistic, useTransition } from "react";
import { GameSwitch } from "@/shared/components/game/game-switch";
import { gameToast } from "@/shared/components/game/game-toaster";
import { setShortlist } from "../actions/set-shortlist";
import type { CollectTarget } from "../queries/get-collect-target";

/** The mission control under a collected card: is this the secret welcomer? */
export function StickerMaybe({ target }: { target: CollectTarget }) {
  const switchId = useId();
  const [shortlisted, setOptimistic] = useOptimistic(target.shortlisted);
  const [, startTransition] = useTransition();

  if (target.ruled) {
    return null;
  }

  const toggle = (on: boolean) => {
    startTransition(async () => {
      setOptimistic(on);
      const result = await setShortlist({ personId: target.id, on });
      if (!result.ok) gameToast(result.error);
    });
  };

  return (
    <div className="flex items-center gap-3">
      <GameSwitch id={switchId} checked={shortlisted} onCheckedChange={toggle} />
      <label htmlFor={switchId} className="cursor-pointer font-medium text-button-sm">
        Could be my welcomer
      </label>
    </div>
  );
}
