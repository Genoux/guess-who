import { getInitials } from "@inbeat/ui/lib/initials";
import { readableOn } from "@/shared/lib/contrast";
import { gameCn } from "./game-cn";

type GameAvatarProps = {
  name: string;
  /** Team color from data. */
  color: string;
  className?: string;
};

/** The player's round initial in the top bar, on their team color. */
export function GameAvatar({ name, color, className }: GameAvatarProps) {
  return (
    <span
      role="img"
      aria-label={name}
      className={gameCn(
        "inline-flex size-10 flex-none items-center justify-center rounded-full font-game-serif text-avatar",
        readableOn(color) === "white" ? "text-white" : "text-game-ink",
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {getInitials(name, "?").slice(0, 1)}
    </span>
  );
}
