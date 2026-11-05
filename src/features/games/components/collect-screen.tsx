"use client";

import { useState } from "react";
import { GameStage } from "@/shared/components/game/game-stage";
import { useFoundSequence } from "../hooks/use-found-sequence";
import type { CollectTarget } from "../queries/get-collect-target";
import type { FoundStats } from "../server/to-game-outcome";
import { CollectBar, CollectDetail } from "./collect-detail";

/** The collect detail as its own page, for direct links to a sticker. */
export function CollectScreen({ target }: { target: CollectTarget }) {
  const [find, setFind] = useState<FoundStats | null>(null);
  const sequence = useFoundSequence();

  return (
    <div className="screen-center flex-1">
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.25rem)] pb-2.5 md:h-18 md:px-6 md:pt-[env(safe-area-inset-top)] md:pb-0 lg:px-10">
        <CollectBar reveal={find ? (sequence.told ? "told" : "playing") : undefined} />
      </div>
      <GameStage className="py-8 md:py-8">
        <CollectDetail target={target} find={find} onFound={setFind} sequence={sequence} />
      </GameStage>
    </div>
  );
}
