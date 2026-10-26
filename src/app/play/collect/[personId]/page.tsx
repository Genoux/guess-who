import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectScreen } from "@/features/games/components/collect-screen";
import { getCollectTarget } from "@/features/games/queries/get-collect-target";
import { GameShell } from "@/shared/components/game/game-shell";

export const metadata: Metadata = { title: "Collect a sticker" };

export default async function CollectPage({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  const target = await getCollectTarget(personId);
  if (!target) notFound();

  return (
    <GameShell>
      <CollectScreen target={target} />
    </GameShell>
  );
}
