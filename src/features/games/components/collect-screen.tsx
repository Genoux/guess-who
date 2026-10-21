"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CloseButton } from "@/shared/components/game/close-button";
import { CountChip } from "@/shared/components/game/count-chip";
import { GameButton } from "@/shared/components/game/game-button";
import { GameField } from "@/shared/components/game/game-field";
import { GameStage } from "@/shared/components/game/game-stage";
import { gameToast } from "@/shared/components/game/game-toaster";
import { Pop } from "@/shared/components/game/pop";
import { Sticker } from "@/shared/components/game/sticker";
import { ROUTES } from "@/shared/config/routes";
import { collectSticker } from "../actions/collect-sticker";
import { setShortlist } from "../actions/set-shortlist";
import type { CollectTarget } from "../queries/get-collect-target";
import { collectStickerSchema, NOTE_MAX } from "../schemas";

/**
 * Meet someone, write what you learned, stick them in. The sticker stays mounted while the
 * server swaps locked for collected, so it flips and throws its stars in place.
 */
export function CollectScreen({ target }: { target: CollectTarget }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [justCollected, setJustCollected] = useState(false);
  const [pending, startTransition] = useTransition();
  const writing = !target.collected && target.active;

  const stick = () => {
    const parsed = collectStickerSchema.safeParse({ personId: target.id, note });
    if (!parsed.success) {
      setError(parsed.error.issues.find((issue) => issue.path[0] === "note")?.message);
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await collectSticker(parsed.data);
      if (!result.ok) {
        gameToast(result.error);
        return;
      }
      setJustCollected(true);
      gameToast("+1 sticker");
    });
  };

  const toggleMaybe = () => {
    startTransition(async () => {
      const result = await setShortlist({ personId: target.id, on: !target.shortlisted });
      if (!result.ok) gameToast(result.error);
    });
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 py-5 md:px-10">
        <CountChip>
          <span className="sr-only">Stickers collected: </span>
          {target.collectedCount} / {target.total}
        </CountChip>
        <CloseButton asChild label="Back to album">
          <Link href={ROUTES.play} />
        </CloseButton>
      </div>

      <GameStage middle className="gap-8 pt-2">
        <Sticker person={target.person} mode={target.mode} size="lg" />

        {writing ? (
          <form
            className="flex w-105 max-w-full flex-col items-center gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              stick();
            }}
          >
            <h1 className="font-game-serif text-hero-md">Met {target.firstName}?</h1>
            <GameField
              multiline
              label="One thing you learned"
              help="Only you see this."
              value={note}
              maxLength={NOTE_MAX}
              error={error}
              onChange={(event) => setNote(event.target.value)}
            />
            <div className="flex flex-wrap items-center justify-center gap-4">
              <GameButton type="submit" disabled={pending}>
                Stick it in
              </GameButton>
              <GameButton asChild variant="link">
                <Link href={ROUTES.play}>Not yet</Link>
              </GameButton>
            </div>
          </form>
        ) : (
          <Pop delay={justCollected ? 0.5 : 0} className="flex flex-col items-center gap-5">
            <div className="flex flex-col items-center gap-1.5">
              <h1 className="font-game-serif text-hero-md">
                {justCollected ? `${target.firstName}’s in.` : target.person.name}
              </h1>
              {justCollected ? (
                <p className="text-game-muted text-lead">
                  {target.collectedCount} of {target.total} collected.
                </p>
              ) : target.note ? (
                <p className="max-w-105 text-game-muted text-lead">
                  <span className="sr-only">Your note: </span>“{target.note}”
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {target.active && target.collected && !target.ruled ? (
                <GameButton
                  variant="yellow"
                  aria-pressed={target.shortlisted}
                  disabled={pending}
                  onClick={toggleMaybe}
                >
                  {target.shortlisted ? "On my maybe list" : "Could be my welcomer"}
                </GameButton>
              ) : null}
              <GameButton asChild variant="light">
                <Link href={ROUTES.play}>Back to album</Link>
              </GameButton>
            </div>
          </Pop>
        )}
      </GameStage>
    </>
  );
}
