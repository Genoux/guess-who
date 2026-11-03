import type { Metadata } from "next";
import { AppTopNav } from "@/features/games/components/app-top-nav";
import { PeopleScreen } from "@/features/games/components/people-screen";
import { getPeopleBoard } from "@/features/games/queries/get-people-board";
import { getTopNav } from "@/features/games/queries/get-top-nav";
import { GameShell } from "@/shared/components/game/game-shell";
import { GameStage } from "@/shared/components/game/game-stage";

export const metadata: Metadata = { title: "People" };

export default async function AdminPage() {
  const [board, nav] = await Promise.all([getPeopleBoard(), getTopNav()]);
  return (
    <GameShell>
      <AppTopNav nav={nav} current="admin" />
      <GameStage width="wide" className="justify-start">
        <PeopleScreen board={board} />
      </GameStage>
    </GameShell>
  );
}
