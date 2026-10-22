"use client";

import Link from "next/link";
import { type ElementType, type ReactNode, useState, useTransition } from "react";
import { CloseButton } from "@/shared/components/game/close-button";
import { CountChip } from "@/shared/components/game/count-chip";
import { GameButton } from "@/shared/components/game/game-button";
import { GameField } from "@/shared/components/game/game-field";
import { gameToast } from "@/shared/components/game/game-toaster";
import { Pop } from "@/shared/components/game/pop";
import { Sticker } from "@/shared/components/game/sticker";
import type { StickerSize } from "@/shared/components/game/sticker-view";
import { ROUTES } from "@/shared/config/routes";
import { collectSticker } from "../actions/collect-sticker";
import { setShortlist } from "../actions/set-shortlist";
import type { CollectTarget } from "../queries/get-collect-target";
import { collectStickerSchema, NOTE_MAX } from "../schemas";

type CollectBarProps = {
  target: CollectTarget;
  /** Closes in place; without it the control is a link back to the album. */
  onClose?: () => void;
};

/** The collected count and the close control above a collect detail. */
export function CollectBar({ target, onClose }: CollectBarProps) {
  return (
    <>
      <CountChip>
        <span className="sr-only">Stickers collected: </span>
        {target.collectedCount} / {target.total}
      </CountChip>
      {onClose ? (
        <CloseButton label="Back to album" onClick={onClose} />
      ) : (
        <CloseButton asChild label="Back to album">
          <Link href={ROUTES.play} />
        </CloseButton>
      )}
    </>
  );
}

type CollectDetailProps = {
  target: CollectTarget;
  /** Leaves in place; without it the exits are links back to the album. */
  onBack?: () => void;
  /** The element that carries the heading, so a dialog can make it its title. */
  headingAs?: ElementType;
  tilt?: boolean;
  /** The album overlay shows the album's own small card, scaled up, so it stays the same card. */
  cardSize?: StickerSize;
  /** Frames the card, for the album overlay's shared-element flight. */
  wrapCard?: (card: ReactNode) => ReactNode;
  /** Frames the heading, note or form and buttons, for the overlay's fade after the card lands. */
  wrapPanel?: (panel: ReactNode) => ReactNode;
};

const keep = (node: ReactNode) => node;

type CelebrateProps = { active: boolean; className: string; children: ReactNode };

/**
 * The collected panel pops in once, right after collecting. Opening a card only shows it: a pop
 * on every mount fought the overlay's own fade and made the text dip and snap.
 */
function Celebrate({ active, className, children }: CelebrateProps) {
  return active ? (
    <Pop delay={0.5} className={className}>
      {children}
    </Pop>
  ) : (
    <div className={className}>{children}</div>
  );
}

/**
 * Meet someone, write what you learned, stick them in. The sticker stays mounted while the
 * server swaps locked for collected, so it flips and throws its confetti in place.
 */
export function CollectDetail({
  target,
  onBack,
  headingAs: Heading = "h1",
  tilt = true,
  cardSize = "lg",
  wrapCard = keep,
  wrapPanel = keep,
}: CollectDetailProps) {
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

  const back = (variant: "link" | "light", label: string) =>
    onBack ? (
      <GameButton variant={variant} onClick={onBack}>
        {label}
      </GameButton>
    ) : (
      <GameButton asChild variant={variant}>
        <Link href={ROUTES.play}>{label}</Link>
      </GameButton>
    );

  return (
    <>
      {wrapCard(<Sticker person={target.person} mode={target.mode} size={cardSize} tilt={tilt} />)}

      {wrapPanel(
        writing ? (
          <form
            className="flex w-105 max-w-full flex-col items-center gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              stick();
            }}
          >
            <Heading className="font-game-serif text-hero-md">Met {target.firstName}?</Heading>
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
              {back("link", "Not yet")}
            </div>
          </form>
        ) : (
          <Celebrate active={justCollected} className="flex flex-col items-center gap-5">
            <div className="flex flex-col items-center gap-1.5">
              <Heading className="font-game-serif text-hero-md">
                {justCollected ? `${target.firstName}’s in.` : target.person.name}
              </Heading>
              {justCollected ? (
                <p className="text-game-muted text-lead">
                  {target.collectedCount} of {target.total} collected.
                </p>
              ) : (
                <>
                  {target.note ? (
                    <p className="max-w-105 text-game-muted text-lead">
                      <span className="sr-only">Your note: </span>“{target.note}”
                    </p>
                  ) : null}
                  {/* The large card prints the fact itself; the small one has no room for it. */}
                  {cardSize === "sm" && target.person.fact ? (
                    <p className="max-w-105 text-pretty text-lead">{target.person.fact}</p>
                  ) : null}
                </>
              )}
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
              {back("light", "Back to album")}
            </div>
          </Celebrate>
        ),
      )}
    </>
  );
}
