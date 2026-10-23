import { GameStage } from "@/shared/components/game/game-stage";
import type { CollectTarget } from "../queries/get-collect-target";
import { CollectBar, CollectDetail } from "./collect-detail";

/** The collect detail as its own page, for direct links to a sticker. */
export function CollectScreen({ target }: { target: CollectTarget }) {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-5 md:px-10">
        <CollectBar target={target} />
      </div>
      <GameStage middle className="pt-2">
        <CollectDetail target={target} />
      </GameStage>
    </>
  );
}
