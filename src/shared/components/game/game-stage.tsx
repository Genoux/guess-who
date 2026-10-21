import type { ReactNode } from "react";
import { gameCn } from "./game-cn";

type GameStageProps = {
  children: ReactNode;
  /** Center the column vertically, for single-moment screens. */
  middle?: boolean;
  /** Use main for the page's primary column (one per page). */
  as?: "main" | "div";
  className?: string;
};

/** The one centered column every player screen is built in. */
export function GameStage({
  children,
  middle = false,
  as: Tag = "main",
  className,
}: GameStageProps) {
  return (
    <Tag
      className={gameCn(
        "mx-auto flex w-full max-w-260 flex-1 flex-col items-center gap-10 px-4 pt-8 pb-16 text-center md:px-8 md:pt-14 md:pb-24",
        middle && "justify-center",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
