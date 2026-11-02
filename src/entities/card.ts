export type CardContent = {
  teamId: string | null;
  location: string | null;
  fact: string | null;
  ask: string | null;
};

const isFilled = (text: string | null) => Boolean(text?.trim());

/** A card joins the album and can welcome only when team, location, fact and ask are all filled in. */
export const isCardComplete = ({ teamId, location, fact, ask }: CardContent) =>
  teamId !== null && [location, fact, ask].every(isFilled);
