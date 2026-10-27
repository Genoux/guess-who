import { type ReactNode, ViewTransition } from "react";
import { gameCn } from "./game-cn";
import { GameMotionConfig } from "./game-motion-config";
import { GameToaster } from "./game-toaster";
import { OverlayLayer } from "./overlay-layer";
import "./game-fonts.css";

type GameShellProps = {
  children: ReactNode;
  /** Full-bleed moments: the clue reveal and the welcomer pick are ink. */
  tone?: "default" | "ink";
  className?: string;
};

const TONES = {
  default: "bg-game-bg text-game-ink",
  ink: "bg-game-ink text-white",
} as const;

/** Root of every player screen: fonts, background, reduced-motion config and the toaster. */
export function GameShell({ children, tone = "default", className }: GameShellProps) {
  // Every screen shares one name, so a navigation pairs the old screen with the new one and the
  // browser cross-fades them (.game-page in game-theme.css). default="none" keeps refreshes and
  // in-page transitions still: only a swap of screens animates.
  return (
    <ViewTransition name="game-page" share="game-page" default="none">
      <div
        className={gameCn(
          "relative flex min-h-dvh flex-col font-game-sans text-base",
          TONES[tone],
          className,
        )}
      >
        <GameMotionConfig>
          <OverlayLayer>{children}</OverlayLayer>
        </GameMotionConfig>
        <GameToaster />
      </div>
    </ViewTransition>
  );
}
