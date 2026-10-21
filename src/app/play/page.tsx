import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlbumBanner } from "@/features/games/components/album-banner";
import { AlbumBoard } from "@/features/games/components/album-board";
import { PlayerTopNav } from "@/features/games/components/player-top-nav";
import { ProgressSlots } from "@/features/games/components/progress-slots";
import { getPlayerAlbum } from "@/features/games/queries/get-player-album";
import { GameShell } from "@/shared/components/game/game-shell";
import { GameStage } from "@/shared/components/game/game-stage";
import { ROUTES } from "@/shared/config/routes";

export const metadata: Metadata = { title: "Your album" };

export default async function AlbumPage() {
  const album = await getPlayerAlbum();
  if (!album) redirect(ROUTES.card);
  if (album.active && !album.introSeen) redirect(ROUTES.playWelcome);

  return (
    <GameShell>
      <PlayerTopNav nav={album.nav} current="album" />
      <GameStage className="max-w-280">
        <div className="flex flex-col items-center gap-5">
          <h1 className="font-game-serif text-hero">Your album</h1>
          <ProgressSlots collected={album.nav.collectedCount} total={album.nav.total} />
        </div>
        {album.outcome ? (
          <AlbumBanner
            href={ROUTES.playFound}
            eyebrow={album.outcome.found ? "Mission complete" : "Day 14 · Time’s up"}
            title={`It was ${album.outcome.welcomerFirstName}.`}
            cta="See them"
          />
        ) : album.newClue ? (
          <AlbumBanner
            href={ROUTES.playClue}
            eyebrow={`Day ${album.newClue.day} · New clue`}
            title={`Clue ${album.newClue.number} just landed.`}
            cta="Open it"
          />
        ) : null}
        {album.stickers.length > 0 ? (
          <AlbumBoard teams={album.teams} stickers={album.stickers} active={album.active} />
        ) : (
          <p className="text-game-muted">
            The album is still empty. Stickers arrive as teammates fill in their cards.
          </p>
        )}
      </GameStage>
    </GameShell>
  );
}
