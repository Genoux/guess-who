import { gameCn } from "@/shared/components/game/game-cn";

type ProgressSlotsProps = {
  collected: number;
  total: number;
  className?: string;
};

/** One slot per sticker in the album, filled as the player collects them. */
export function ProgressSlots({ collected, total, className }: ProgressSlotsProps) {
  if (total === 0) return null;
  return (
    <div
      role="img"
      aria-label={`${collected} of ${total} stickers`}
      className={gameCn("flex max-w-160 flex-wrap justify-center gap-1", className)}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: slots are positions, not items
          key={index}
          className={gameCn(
            "h-4 w-3 rounded-xs",
            index < collected ? "bg-game-ink" : "bg-game-border",
          )}
        />
      ))}
    </div>
  );
}
