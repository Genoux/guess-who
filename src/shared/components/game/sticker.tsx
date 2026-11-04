"use client";

import { cva } from "class-variance-authority";
import { AnimatePresence, motion, type Transition, useReducedMotion } from "motion/react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { celebrate, originFromElement } from "@/shared/lib/celebrate";
import { CardBacking, cardSurfaceVariants } from "./card-surface";
import { Flip } from "./flip";
import { gameCn } from "./game-cn";
import { TRANSITION } from "./game-motion";
import { StickerAsk } from "./sticker-ask";
import { factRowVariants, factTextVariants } from "./sticker-motion";
import { StickerStampMark } from "./sticker-stamp";
import {
  type AskTextStep,
  getAskTextStep,
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
  /** What the sticker sits on: the game background, ink or the orange of the found stage. */
  backdrop?: "light" | "dark" | "found";
  /** Seconds to wait before a mode change turns the card, for a beat after it arrives. */
  flipDelay?: number;
  /** Runs once a turn to the collected face has landed. */
  onFlipped?: () => void;
  /**
   * Slides the fact in under the photo and fades the ask toggle in. The large card is always
   * expanded; the small one is, as in the album grid, only when told to be.
   */
  expanded?: boolean;
  /** What the card mounts as, so it can open or close on arrival; `expanded` itself by default. */
  expandedFrom?: boolean;
  /** The motion of the open or the close, e.g. the flight the card rides in on. */
  expandTransition?: Transition;
  /** Adds the + button that shows the ask over the card; off unless a screen wants it. */
  askToggle?: boolean;
  /** Holds the ask open while true, e.g. while its field is being edited; needs `askToggle`. */
  askRevealed?: boolean;
  /**
   * Sits centered over the card, in front of the ask panel, and tilts with it, e.g. an Edit button.
   * It shows on hover or keyboard focus, always on a touch screen, with the art dimmed behind it.
   */
  centerAction?: ReactNode;
  /** Turns `centerAction` off: hidden, inert and without the dim, e.g. while the card is edited. */
  centerActionEnabled?: boolean;
  className?: string;
};

const stickerVariants = cva("relative flex-none text-left text-game-ink", {
  variants: {
    size: { sm: "h-62 w-(--sticker-width-sm)", lg: "h-106 w-(--sticker-width-lg)" },
  },
});

const faceVariants = cva("absolute inset-0 flex flex-col bg-game-surface p-(--face-inset)", {
  variants: {
    size: { sm: "ask-geometry-sm", lg: "ask-geometry-lg" },
  },
});

const artVariants = cva("relative flex min-h-min flex-1 flex-col overflow-hidden", {
  variants: {
    size: { sm: "rounded-card-art", lg: "rounded-card-art-lg" },
  },
});

// The center action and the dim behind it fade in together: on hover, on keyboard focus, and
// always on a touch screen, which has no hover.
const CENTER_REVEAL =
  "transition-[opacity,scale] duration-fast ease-game motion-reduce:transition-none";
const CENTER_SHOWN =
  "group-hover/center:opacity-100 group-has-[:focus-visible]/center:opacity-100 pointer-coarse:opacity-100";

// Sized so a 55 character ask fits the locked face's box on both stickers; see `getAskTextStep`.
const ASK_TEXT: Record<StickerSize, Record<AskTextStep, string>> = {
  sm: { large: "text-quote", medium: "text-small", small: "text-fine" },
  lg: { large: "text-name-lg", medium: "text-clue", small: "text-heading" },
};

const askingVariants = cva("flex min-h-0 flex-1 flex-col", {
  variants: {
    size: { sm: "gap-1 px-(--ask-pad) pt-2.5", lg: "gap-2 px-(--ask-pad) pt-4" },
  },
});

// The name and team sit on the art's bottom edge. Over a photo they are white on a scrim that
// eases in over `--fade`; on the tint they are plain.
const captionVariants = cva("relative flex flex-none flex-col gap-0.5", {
  variants: {
    size: { sm: "px-(--ask-pad) pb-2.25", lg: "px-(--ask-pad) pb-3" },
    scrim: {
      none: "pt-3",
      album:
        "pt-(--fade) text-white sticker-scrim [--fade:calc(var(--spacing)*8)] [--scrim-max:0.74]",
      large:
        "pt-(--fade) text-white sticker-scrim [--fade:calc(var(--spacing)*10)] [--scrim-blur:10px] [--scrim-max:0.62]",
    },
  },
});

// On the clipping box, not the text: the soft edge is a line high (`1lh`) at this type size.
const FACT_TEXT: Record<StickerSize, string> = { sm: "text-fine", lg: "text-base" };

const factVariants = cva("px-1 pb-0.5 text-pretty wrap-anywhere", {
  variants: {
    size: { sm: "pt-2", lg: "pt-3" },
  },
});

const nameVariants = cva("relative max-w-full text-balance font-game-serif wrap-anywhere", {
  variants: {
    size: { sm: "text-name", lg: "text-clue" },
  },
});

type StickerCaptionProps = {
  name: string;
  subtitle: string;
  size: StickerSize;
  overPhoto: boolean;
};

function StickerCaption({ name, subtitle, size, overPhoto }: StickerCaptionProps) {
  const scrim = !overPhoto ? "none" : size === "lg" ? "large" : "album";
  return (
    <div className={captionVariants({ size, scrim })}>
      {scrim === "large" ? (
        <span aria-hidden className="pointer-events-none absolute inset-0 sticker-scrim-blur" />
      ) : null}
      <span className={nameVariants({ size })}>{name}</span>
      <span className="relative max-w-full text-small wrap-anywhere">{subtitle}</span>
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
          "absolute inset-0 size-full object-cover object-[center_15%]",
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
  backdrop = "light",
  flipDelay,
  onFlipped,
  expanded,
  expandedFrom,
  expandTransition = TRANSITION.enter,
  askToggle = false,
  askRevealed,
  centerAction,
  centerActionEnabled = true,
  className,
}: StickerProps) {
  const view = getStickerView(person, mode);
  const factShown = expanded ?? size === "lg";
  const factFrom = expandedFrom ?? factShown;
  const reducedMotion = useReducedMotion() ?? false;
  // Orange on orange would drop the edge and the shadow, so a card on the found stage keeps ink.
  const edge = (mode === "found" || mode === "welcomer") && backdrop !== "found" ? "found" : "ink";
  const rootRef = useRef<HTMLDivElement>(null);
  const previousMode = useRef(mode);
  // The celebration a mode change earned, spent when its moment lands: the turn.
  const pendingCelebration = useRef<"unlock" | null>(null);
  // A picture that fails to load (expired, blocked) falls back to the initials.
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const photoUrl = person.photoUrl && person.photoUrl !== failedPhoto ? person.photoUrl : null;
  const tintStyle = { backgroundColor: person.tint, color: person.tintInk };

  useEffect(() => {
    const kind = stickerCelebration(previousMode.current, mode);
    previousMode.current = mode;
    pendingCelebration.current = celebrateChanges ? kind : null;
  }, [mode, celebrateChanges]);

  const celebrateUnlock = () => {
    if (pendingCelebration.current !== "unlock") return;
    pendingCelebration.current = null;
    if (rootRef.current) {
      void celebrate(originFromElement(rootRef.current), {
        kind: "unlock",
        palette: backdrop,
      });
    }
  };

  const front = (
    <>
      <CardBacking size={size} edge={edge} />
      <div className={gameCn(faceVariants({ size }), cardSurfaceVariants({ size, edge }))}>
        <div className={artVariants({ size })} style={tintStyle}>
          <div className={askingVariants({ size })}>
            <span className="text-small">Ask me about</span>
            <span
              className={gameCn(
                "font-game-serif wrap-anywhere",
                ASK_TEXT[size][getAskTextStep(person.ask, size)],
              )}
            >
              {person.ask}
            </span>
          </div>
          <StickerCaption
            name={person.name}
            subtitle={view.subtitle}
            size={size}
            overPhoto={false}
          />
        </div>
      </div>
    </>
  );

  const back = (
    <>
      <CardBacking size={size} edge={edge} />
      <div className={gameCn(faceVariants({ size }), cardSurfaceVariants({ size, edge }))}>
        <div className={artVariants({ size })} style={tintStyle}>
          {photoUrl ? (
            <StickerPhoto
              key={photoUrl}
              url={photoUrl}
              name={person.name}
              onError={() => setFailedPhoto(photoUrl)}
            />
          ) : null}
          {centerAction ? (
            <span
              aria-hidden
              className={gameCn(
                "pointer-events-none absolute inset-0 sticker-dim opacity-0",
                CENTER_REVEAL,
                centerActionEnabled && CENTER_SHOWN,
              )}
            />
          ) : null}
          <div className="relative flex min-h-0 flex-1 items-center justify-center [container-type:size]">
            {photoUrl ? null : (
              <span
                aria-hidden
                className={gameCn(
                  "font-game-serif leading-none",
                  size === "lg" ? "text-[min(96px,62cqh)]" : "text-[min(56px,62cqh)]",
                )}
              >
                {view.initials}
              </span>
            )}
          </div>
          <StickerCaption
            name={person.name}
            subtitle={view.subtitle}
            size={size}
            overPhoto={photoUrl !== null}
          />
        </div>
        {person.fact ? (
          // Always laid out, so the card can open to it without moving anything else: a row of
          // zero height grows to the fact's own, and the photo gives way.
          <motion.div
            inert={!factShown}
            className="grid flex-none"
            variants={factRowVariants(expandTransition, reducedMotion)}
            initial={factFrom ? "shown" : "hidden"}
            animate={factShown ? "shown" : "hidden"}
          >
            <div className={gameCn("fact-reveal-mask min-h-0 overflow-hidden", FACT_TEXT[size])}>
              <motion.p
                className={factVariants({ size })}
                variants={factTextVariants(expandTransition, reducedMotion)}
              >
                {person.fact}
              </motion.p>
            </div>
          </motion.div>
        ) : null}
        {askToggle ? (
          <StickerAsk
            ask={person.ask}
            tint={person.tint}
            tintInk={person.tintInk}
            size={size}
            askTextClass={ASK_TEXT[size][getAskTextStep(person.ask, size)]}
            shown={factShown}
            shownFrom={factFrom}
            revealed={askRevealed}
          />
        ) : null}
      </div>
    </>
  );

  return (
    <div
      ref={rootRef}
      className={gameCn(stickerVariants({ size }), centerAction && "group/center", className)}
    >
      <Tilt className="relative size-full" disabled={!tilt}>
        <div
          className="relative size-full"
          style={rot ? { transform: `rotate(${rot}deg)` } : undefined}
        >
          {centerAction ? (
            // First in the tab order, painted over the ask panel (z-10) and its + button (z-20).
            <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center">
              <div
                inert={!centerActionEnabled}
                className={gameCn(
                  "pointer-events-auto scale-90 opacity-0",
                  CENTER_REVEAL,
                  centerActionEnabled &&
                    gameCn(
                      CENTER_SHOWN,
                      "group-hover/center:scale-100 group-has-[:focus-visible]/center:scale-100 pointer-coarse:scale-100",
                    ),
                )}
              >
                {centerAction}
              </div>
            </div>
          ) : null}
          <Flip
            className="size-full"
            flipped={view.open}
            delay={flipDelay}
            front={front}
            back={back}
            onFlipped={() => {
              celebrateUnlock();
              if (view.open) onFlipped?.();
            }}
          />
          {/* A badge already on the card shows as is; only one added while it is on screen stamps in. */}
          <AnimatePresence initial={false}>
            {view.stamp ? (
              <StickerStampMark key={view.stamp} stamp={view.stamp} size={size} />
            ) : null}
          </AnimatePresence>
        </div>
      </Tilt>
    </div>
  );
}
