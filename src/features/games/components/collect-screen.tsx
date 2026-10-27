import { GameStage } from "@/shared/components/game/game-stage";
import type { CollectTarget } from "../queries/get-collect-target";
import { CollectBar, CollectDetail } from "./collect-detail";

/** The collect detail as its own page, for direct links to a sticker. */
export function CollectScreen({ target }: { target: CollectTarget }) {
  return (
    <div className="screen-center flex-1">
      <div className="flex items-center justify-between px-4 pt-1 pb-2.5 md:h-18 md:px-10 md:py-0">
        <CollectBar target={target} />
      </div>
      <GameStage className="py-8 md:py-8">
        <CollectDetail target={target} />
      </GameStage>
    </div>
  );
}
