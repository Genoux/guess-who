import type { ReactNode } from "react";
import { gameCn } from "./game-cn";

type GameBookProps = {
  children: ReactNode;
  as?: "section" | "div";
  className?: string;
};

/** The white page that holds the album grid, the maybes and the card form. */
export function GameBook({ children, as: Tag = "section", className }: GameBookProps) {
  return (
    <Tag
      className={gameCn(
        "flex w-full flex-col items-center gap-6 rounded-book bg-game-surface p-6 md:p-8",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
