import type { ReactNode } from "react";
import { gameCn } from "./game-cn";

type GameStageProps = {
  children: ReactNode;
  /** Use main for the page's primary column (one per page). */
  as?: "main" | "div";
  /** How wide the column may grow: the game screens' 1040px, or 1200px for the admin lists. */
  width?: "game" | "wide";
  className?: string;
};

const WIDTHS = { game: "max-w-260", wide: "max-w-300" } as const;

/** The one column every player screen is built in: it fills the screen and centers its content. */
export function GameStage({
  children,
  as: Tag = "main",
  width = "game",
  className,
}: GameStageProps) {
  return (
    <Tag
      className={gameCn(
        "mx-auto flex w-full flex-1 flex-col items-center justify-center gap-10 p-10 text-center",
        WIDTHS[width],
        className,
      )}
    >
      {children}
    </Tag>
  );
}
