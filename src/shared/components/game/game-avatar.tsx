"use client";

import { getInitials } from "@inbeat/ui/lib/initials";
import { useState } from "react";
import { readableOn } from "@/shared/lib/contrast";
import { gameCn } from "./game-cn";

type GameAvatarProps = {
  name: string;
  /** Team color from data. */
  color: string;
  /** The person's picture, round over their initial; the initial stays if it will not load. */
  photoUrl?: string | null;
  className?: string;
};

/** The person's round picture, or their initial on their team color. */
export function GameAvatar({ name, color, photoUrl, className }: GameAvatarProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const photo = photoUrl && photoUrl !== failed ? photoUrl : null;
  return (
    <span
      role="img"
      aria-label={name}
      className={gameCn(
        "relative inline-flex size-10 flex-none items-center justify-center overflow-hidden rounded-full font-game-serif text-avatar",
        readableOn(color) === "white" ? "text-white" : "text-game-ink",
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {photo ? (
        // biome-ignore lint/performance/noImgElement: a small profile picture at its own size, from Clerk or storage
        <img
          src={photo}
          alt=""
          width={80}
          height={80}
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
          onError={() => setFailed(photo)}
        />
      ) : (
        getInitials(name, "?").slice(0, 1)
      )}
    </span>
  );
}
