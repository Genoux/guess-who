import type { ReactNode } from "react";
import { gameCn } from "./game-cn";
import { GameToaster } from "./game-toaster";
import "./game-fonts.css";

type GameShellProps = {
  children: ReactNode;
  /** Full-bleed moments: the clue reveal and the welcomer pick are ink, found is orange. */
  tone?: "default" | "ink" | "found";
  className?: string;
};

const TONES = {
  default: "bg-game-bg text-game-ink",
  ink: "bg-game-ink text-white",
  found: "bg-game-found text-game-ink",
} as const;

/** Root of every player screen: Fieldtrip fonts, game background and the game toaster. */
export function GameShell({ children, tone = "default", className }: GameShellProps) {
  return (
    <div
      className={gameCn(
        "relative flex min-h-dvh flex-col font-game-sans text-base",
        TONES[tone],
        className,
      )}
    >
      {children}
      <GameToaster />
    </div>
  );
}
