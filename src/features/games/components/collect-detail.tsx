"use client";

import Link from "next/link";
import type { ElementType, ReactNode } from "react";
import { CardDetail, CardDetailFacts } from "@/shared/components/game/card-detail";
import { CloseButton } from "@/shared/components/game/close-button";
import { Sticker } from "@/shared/components/game/sticker";
import { ROUTES } from "@/shared/config/routes";
import { OPEN_SCALE } from "../lib/album-motion";
import type { CollectTarget } from "../queries/get-collect-target";
import { StickerGuess } from "./sticker-guess";
import { StickerMaybe } from "./sticker-maybe";
import { StickerNotes } from "./sticker-notes";

type CollectBarProps = {
  target: CollectTarget;
  /** Closes in place; without it the control is a link back to the album. */
  onClose?: () => void;
};

/** The collected count and the close control above a collect detail. */
export function CollectBar({ onClose }: CollectBarProps) {
  return (
    <div className="flex items-center justify-end w-full">
      {onClose ? (
        <CloseButton tone="soft" label="Back to album" onClick={onClose} />
      ) : (
        <CloseButton asChild tone="soft" label="Back to album">
          <Link href={ROUTES.play} />
        </CloseButton>
      )}
    </div>
  );
}

type CollectDetailProps = {
  target: CollectTarget;
  /** The element that carries the name, so a dialog can make it its title. */
  headingAs?: ElementType;
  tilt?: boolean;
  /** Frames the card; the album overlay flies it in from its slot. */
  wrapCard?: (card: ReactNode) => ReactNode;
  /** Frames everything but the card; the album overlay fades it in once the card lands. */
  wrapContent?: (content: ReactNode) => ReactNode;
};

// The album's own small card, zoomed: the same card in the grid and open, so the open card never
// prints the fact the panel already shows.
const zoomed = (card: ReactNode) => <div style={{ zoom: OPEN_SCALE }}>{card}</div>;
const keep = (node: ReactNode) => node;

/**
 * One sticker, open. The card and its mission switch on the left; on the right who they are,
 * what to ask them and the player's notes, short enough to sit beside the card.
 */
export function CollectDetail({
  target,
  headingAs: Heading = "h1",
  tilt = true,
  wrapCard = zoomed,
  wrapContent = keep,
}: CollectDetailProps) {
  const { person } = target;

  return (
    <CardDetail
      card={wrapCard(<Sticker person={person} mode={target.mode} size="sm" tilt={tilt} />)}
      cardFooter={
        target.active && target.collected ? wrapContent(<StickerMaybe target={target} />) : null
      }
      panel={wrapContent(
        <div className="flex flex-col gap-8">
          {/* Stacked on a phone, the card right above already shows the name. */}
          <Heading className="font-game-serif text-hero-md max-md:sr-only">{person.name}</Heading>
          <CardDetailFacts
            facts={[
              { label: "Location", value: person.city },
              { label: "Fun fact", value: person.fact },
              // A locked card prints its ask line on the face; an open one has no room for it.
              { label: "Ask me about", value: target.mode === "locked" ? null : person.ask },
            ]}
          />
          <StickerNotes target={target} />
        </div>,
      )}
      footer={
        target.active && target.collected
          ? wrapContent(
              // Not gated on `ruled`: the guess keeps its "Not X." moment open after the card is
              // ruled out, and the rule hides once the button is gone.
              <div className="hidden justify-end border-game-border border-t pt-6 has-[button]:flex">
                <StickerGuess target={target} />
              </div>,
            )
          : null
      }
    />
  );
}
