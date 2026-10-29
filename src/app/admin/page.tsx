import type { Metadata } from "next";
import { NewHiresScreen } from "@/features/games/components/new-hires-screen";
import { TeammateTopNav } from "@/features/games/components/teammate-top-nav";
import { getIsWelcomer } from "@/features/games/queries/get-is-welcomer";
import { getNewHireBoard } from "@/features/games/queries/get-new-hire-board";
import { GameShell } from "@/shared/components/game/game-shell";
import { GameStage } from "@/shared/components/game/game-stage";

export const metadata: Metadata = { title: "New hires" };

export default async function AdminPage() {
  const [board, welcomer] = await Promise.all([getNewHireBoard(), getIsWelcomer()]);
  return (
    <GameShell>
      <TeammateTopNav current="admin" admin welcomer={welcomer} />
      <GameStage>
        <NewHiresScreen board={board} />
      </GameStage>
    </GameShell>
  );
}
