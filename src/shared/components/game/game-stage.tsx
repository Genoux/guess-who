import type { ReactNode } from "react";
import { gameCn } from "./game-cn";

type GameStageProps = {
  children: ReactNode;
  /** Use main for the page's primary column (one per page). */
  as?: "main" | "div";
  className?: string;
};

/** The one column every player screen is built in: it fills the screen and centers its content. */
export function GameStage({ children, as: Tag = "main", className }: GameStageProps) {
  return (
    <Tag
      className={gameCn(
        "mx-auto flex w-full max-w-260 flex-1 flex-col items-center justify-center gap-10 px-4 py-8 text-center md:px-8 md:py-12",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
