// Chosen so long-worded sentences at these lengths fit both stickers without clipping, measured in
// a browser; see `longest` and `unbroken` in the sticker fixtures. Change them together.
export const CARD_LIMITS = { location: 25, fact: 120, ask: 55 } as const;

export type CardContent = {
  teamId: string | null;
  location: string | null;
  fact: string | null;
  ask: string | null;
};

const isFilled = (text: string | null) => Boolean(text?.trim());

/** The part of a card its person writes; location comes from Deel. */
export const hasOwnCardFields = ({
  teamId,
  fact,
  ask,
}: Pick<CardContent, "teamId" | "fact" | "ask">) => teamId !== null && [fact, ask].every(isFilled);

/** A card joins the album and can welcome only when team, location, fact and ask are all filled in. */
export const isCardComplete = ({ teamId, location, fact, ask }: CardContent) =>
  teamId !== null && [location, fact, ask].every(isFilled);
