import Link from "next/link";
import { GameButton } from "@/shared/components/game/game-button";
import { GameShell } from "@/shared/components/game/game-shell";
import { GameStage } from "@/shared/components/game/game-stage";
import { ROUTES } from "@/shared/config/routes";
import { TeammateTopNav } from "./teammate-top-nav";

type WelcomerHomeProps = {
  playerFirstName: string;
  /** All three of their clues are written. */
  cluesSet: boolean;
  /** Adds the New hires tab to the top bar. */
  admin?: boolean;
};

/** The secret welcomer's page: who they are welcoming, and the way to their clues. */
export function WelcomerHome({ playerFirstName, cluesSet, admin = false }: WelcomerHomeProps) {
  return (
    <GameShell tone="ink">
      <TeammateTopNav current="welcomer" admin={admin} welcomer tone="ink" />
      <GameStage className="gap-8 pt-0">
        <div className="flex flex-col items-center gap-3">
          <span className="font-game-mono text-caption text-game-shortlist uppercase">
            Top secret
          </span>
          <h1 className="max-w-180 font-game-serif text-3xl sm:text-hero">
            You’re {playerFirstName}’s secret welcomer.
          </h1>
          <p className="text-balance text-game-border-strong text-base sm:text-lead">
            {cluesSet
              ? "Your clues are set. Now wait to be found."
              : "Leave three clues. Then wait to be found."}
          </p>
        </div>
        <GameButton asChild variant="yellow">
          <Link href={ROUTES.clues}>{cluesSet ? "See my clues" : "Write my clues"}</Link>
        </GameButton>
      </GameStage>
    </GameShell>
  );
}
