"use client";

import { useState } from "react";
import { noor } from "@/shared/components/game/fixtures";
import { GameButton } from "@/shared/components/game/game-button";
import { Reveal } from "@/shared/components/game/reveal";
import { Sticker } from "@/shared/components/game/sticker";
import type { StickerMode } from "@/shared/components/game/sticker-view";
import { celebrate } from "@/shared/lib/celebrate";
import { PropCode } from "./prop-code";

const STAMP_ORDER: StickerMode[] = ["collected", "maybe", "ruled", "found"];

/** Flip, stamp, reveal, tilt and confetti, all live. */
export function EffectsDemo() {
  const [mode, setMode] = useState<StickerMode>("locked");
  const [revealKey, setRevealKey] = useState(0);

  const nextStamp = () => {
    const index = STAMP_ORDER.indexOf(mode);
    setMode(STAMP_ORDER[(index + 1) % STAMP_ORDER.length] ?? "collected");
  };

  return (
    <div className="flex flex-wrap items-center gap-10">
      <div className="flex flex-col items-center gap-3">
        <Sticker person={noor} mode={mode} />
        <PropCode>{`mode="${mode}"`}</PropCode>
      </div>
      <div className="flex flex-col items-start gap-3">
        <GameButton size="sm" onClick={() => setMode(mode === "locked" ? "collected" : "locked")}>
          {mode === "locked" ? "Unlock (flip)" : "Lock again"}
        </GameButton>
        <GameButton size="sm" variant="yellow" onClick={nextStamp}>
          Stamp next mode
        </GameButton>
        <GameButton size="sm" variant="light" onClick={() => void celebrate({ x: 0.5, y: 0.7 })}>
          Sparkle burst
        </GameButton>
        <GameButton size="sm" variant="light" onClick={() => setRevealKey((key) => key + 1)}>
          Replay reveal
        </GameButton>
        <p className="text-game-muted text-small">Hover the sticker to tilt it.</p>
      </div>
      <Reveal key={revealKey} className="flex flex-col items-center gap-1.5">
        <span className="font-game-serif text-hero-md">Noor’s in.</span>
        <span className="text-game-muted text-lead">6 of 20 collected.</span>
      </Reveal>
    </div>
  );
}
