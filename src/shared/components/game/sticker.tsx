"use client";

import { cva } from "class-variance-authority";
import { PlusIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { type CelebratePalette, celebrate, originFromElement } from "@/shared/lib/celebrate";
import { CardBacking, cardSurfaceVariants } from "./card-surface";
import { Flip } from "./flip";
import { gameCn } from "./game-cn";
import { TRANSITION } from "./game-motion";
import { StickerStampMark } from "./sticker-stamp";
import {
  getStickerView,
  type StickerMode,
  type StickerPerson,
  type StickerSize,
  stickerCelebration,
} from "./sticker-view";
import { Tilt } from "./tilt";

export type StickerProps = {
  person: StickerPerson;
  mode?: StickerMode;
  size?: StickerSize;
  /** Hand-stuck angle in degrees (-6 to 6), only in the album. */
  rot?: number;
  /** Hover tilt; off for stickers fanned out behind another one. */
  tilt?: boolean;
  /** Confetti when the sticker unlocks or turns found. */
  celebrateChanges?: boolean;
  /** Confetti colors for the background the sticker sits on: light, ink (dark) or orange (found). */
  celebratePalette?: CelebratePalette;
  /** Seconds to wait before a mode change turns the card, for a beat after it arrives. */
  flipDelay?: number;
  /** Runs once a turn to the collected face has landed. */
  onFlipped?: () => void;
  className?: string;
};

const stickerVariants = cva("relative flex-none text-left text-game-ink", {
  variants: {
    size: { sm: "h-62 w-44", lg: "h-106 w-75" },
  },
});

// Only loading fades the photo; ruled-out cards keep their normal appearance.
const faceVariants = cva("absolute inset-0 flex flex-col bg-game-surface", {
  variants: {
    size: { sm: "gap-2 p-2", lg: "gap-3 p-2.5" },
  },
});

const artVariants = cva("relative flex min-h-0 flex-1 overflow-hidden", {
  variants: {
    size: { sm: "rounded-card-art", lg: "rounded-card-art-lg" },
  },
});

const nameVariants = cva("max-w-full truncate font-game-serif", {
  variants: {
    size: { sm: "text-name", lg: "text-name-lg" },
  },
});

const subtitleVariants = cva("max-w-full truncate text-game-muted", {
  variants: {
    size: { sm: "text-sm", lg: "text-base" },
  },
});

const infoVariants = cva("flex min-w-0 flex-none flex-col text-left", {
  variants: {
    size: { sm: "px-1 pb-0.5", lg: "px-1.5 pb-1" },
  },
});

type StickerInfoProps = {
  name: string;
  subtitle: string;
  size: StickerSize;
};

function StickerInfo({ name, subtitle, size }: StickerInfoProps) {
  return (
    <div className={infoVariants({ size })}>
      <span className={nameVariants({ size })}>{name}</span>
      <span className={subtitleVariants({ size })}>{subtitle}</span>
    </div>
  );
}

type StickerPhotoProps = {
  url: string;
  name: string;
  onError: () => void;
};

/** The profile picture over a muted placeholder that breathes until the picture has loaded. */
function StickerPhoto({ url, name, onError }: StickerPhotoProps) {
  const [loaded, setLoaded] = useState(false);
  // A picture already in the cache shows at once, so a remounted sticker does not flash; only a
  // picture that arrives later fades in.
  const [fadeIn, setFadeIn] = useState(true);
  // A cached picture can finish before React attaches onLoad, so check it once it is in the page.
  const checkLoaded = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) {
      setFadeIn(false);
      setLoaded(true);
    }
  }, []);

  return (
    <>
      {loaded ? null : (
        <motion.span
          aria-hidden
          className="absolute inset-0 bg-game-hover"
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 0.55, 1] }}
          transition={TRANSITION.pulse}
        />
      )}
      {/* biome-ignore lint/performance/noImgElement: profile pictures come from Clerk or storage at their own size, not optimised per request */}
      <img
        ref={checkLoaded}
        src={url}
        alt={name}
        onLoad={() => setLoaded(true)}
        onError={onError}
        className={gameCn(
          "absolute inset-0 size-full object-cover",
          fadeIn && "transition-opacity duration-base ease-game",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </>
  );
}

/** The person card: locked shows the ask-me-about line, every other mode the collected face. */
export function Sticker({
  person,
  mode = "collected",
  size = "sm",
  rot = 0,
  tilt = true,
  celebrateChanges = true,
  celebratePalette = "light",
  flipDelay,
  onFlipped,
  className,
}: StickerProps) {
  const view = getStickerView(person, mode, size);
  const rootRef = useRef<HTMLDivElement>(null);
  const previousMode = useRef(mode);
  // The celebration a mode change earned, spent when its moment lands: the turn or the stamp.
  const pendingCelebration = useRef<"unlock" | "found" | null>(null);
  // A picture that fails to load (expired, blocked) falls back to the initials.
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const photoUrl = person.photoUrl && person.photoUrl !== failedPhoto ? person.photoUrl : null;

  useEffect(() => {
    const kind = stickerCelebration(previousMode.current, mode);
    previousMode.current = mode;
    pendingCelebration.current = celebrateChanges ? kind : null;
  }, [mode, celebrateChanges]);

  const celebrateIf = (kind: "unlock" | "found") => {
    if (pendingCelebration.current !== kind) return;
    pendingCelebration.current = null;
    if (rootRef.current) {
      void celebrate(originFromElement(rootRef.current), { kind, palette: celebratePalette });
    }
  };

  const front = (
    <>
      <CardBacking size={size} />
      <div className={gameCn(faceVariants({ size }), cardSurfaceVariants({ size }))}>
        <div
          className={gameCn(
            artVariants({ size }),
            "flex-col justify-between gap-2",
            size === "lg" ? "p-5" : "p-3",
          )}
          style={{ backgroundColor: person.tint, color: person.tintInk }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-game-mono text-caption uppercase">Ask me about</span>
            <span
              className={gameCn(
                "inline-flex flex-none items-center justify-center rounded-full bg-game-surface text-game-ink",
                size === "lg" ? "size-7.5" : "size-5.5",
              )}
            >
              <PlusIcon aria-hidden className="size-3.5" strokeWidth={2.25} />
            </span>
          </div>
          <span
            className={gameCn(
              "line-clamp-5 font-game-serif",
              size === "lg" ? "text-name-lg" : "text-quote",
            )}
          >
            {person.ask}
          </span>
        </div>
        <StickerInfo name={person.name} subtitle={person.team} size={size} />
      </div>
    </>
  );

  const back = (
    <>
      <CardBacking size={size} />
      <div className={gameCn(faceVariants({ size }), cardSurfaceVariants({ size }))}>
        <div
          className={gameCn(
            artVariants({ size }),
            "items-center justify-center",
            photoUrl && "bg-game-hover",
          )}
          style={photoUrl ? undefined : { backgroundColor: person.color }}
        >
          {photoUrl ? (
            <StickerPhoto
              key={photoUrl}
              url={photoUrl}
              name={person.name}
              onError={() => setFailedPhoto(photoUrl)}
            />
          ) : (
            <span
              aria-hidden
              className={gameCn(
                "font-game-serif",
                size === "lg" ? "text-mark-lg" : "text-mark",
                view.initialsTone === "white" ? "text-white" : "text-game-ink",
              )}
            >
              {view.initials}
            </span>
          )}
        </div>
        <StickerInfo name={person.name} subtitle={view.subtitle} size={size} />
        {view.showMore ? (
          <div className="flex flex-none flex-col items-start gap-3 border-game-border border-t px-1.5 pt-3 pb-1 text-left">
            {/* The locked face already printed the ask; open, the fact is the new part. */}
            {person.fact ? (
              <p className="line-clamp-2 text-balance font-game-serif text-quote">{person.fact}</p>
            ) : null}
            <div className="flex flex-col gap-0.5">
              <span className="font-game-mono text-caption text-game-muted uppercase">
                Ask me about
              </span>
              <p className="line-clamp-1 text-game-muted text-sm">{person.ask}</p>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );

  return (
    <div ref={rootRef} className={gameCn(stickerVariants({ size }), className)}>
      <Tilt className="relative size-full" disabled={!tilt}>
        <div
          className="relative size-full"
          style={rot ? { transform: `rotate(${rot}deg)` } : undefined}
        >
          <Flip
            className="size-full"
            flipped={view.open}
            delay={flipDelay}
            front={front}
            back={back}
            onFlipped={() => {
              celebrateIf("unlock");
              if (view.open) onFlipped?.();
            }}
          />
          {/* A badge already on the card shows as is; only one added while it is on screen stamps in. */}
          <AnimatePresence initial={false}>
            {view.stamp ? (
              <StickerStampMark
                key={view.stamp}
                stamp={view.stamp}
                size={size}
                onLanded={() => celebrateIf("found")}
              />
            ) : null}
          </AnimatePresence>
        </div>
      </Tilt>
    </div>
  );
}
