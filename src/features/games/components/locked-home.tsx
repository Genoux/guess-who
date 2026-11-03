import { GameShell } from "@/shared/components/game/game-shell";
import { GameStage } from "@/shared/components/game/game-stage";
import type { TopNavData } from "../lib/top-nav";
import { AppTopNav } from "./app-top-nav";

/** What a new hire sees while they have no mission: nothing to open yet, and a line to say so. */
export function LockedHome({ nav }: { nav: TopNavData }) {
  return (
    <GameShell>
      <AppTopNav nav={nav} current="album" />
      <GameStage className="gap-3">
        <h1 className="font-game-serif text-hero-md md:text-hero">Welcome to The Album</h1>
        <p className="max-w-130 text-balance text-game-muted text-lead">
          Your album isn't ready yet. Your mission will open soon.
        </p>
      </GameStage>
    </GameShell>
  );
}
