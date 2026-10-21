"use client";

import { useState } from "react";
import { GameButton } from "@/shared/components/game/game-button";
import { Pop } from "@/shared/components/game/pop";
import { Sticker } from "@/shared/components/game/sticker";
import type { StickerMode } from "@/shared/components/game/sticker-view";
import { celebrate } from "@/shared/lib/celebrate";
import { noor } from "./fixtures";
import { PropCode } from "./prop-code";

const STAMP_ORDER: StickerMode[] = ["collected", "maybe", "ruled", "found"];

/** Flip, stamp, pop, tilt and stars, all live. */
export function EffectsDemo() {
  const [mode, setMode] = useState<StickerMode>("locked");
  const [popKey, setPopKey] = useState(0);

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
        <GameButton size="sm" variant="light" onClick={() => setPopKey((key) => key + 1)}>
          Replay pop
        </GameButton>
        <p className="text-game-muted text-small">Hover the sticker to tilt it.</p>
      </div>
      <Pop key={popKey} className="flex flex-col items-center gap-1.5">
        <span className="font-game-serif text-hero-md">Noor’s in.</span>
        <span className="text-game-muted text-lead">6 of 20 collected.</span>
      </Pop>
    </div>
  );
}
