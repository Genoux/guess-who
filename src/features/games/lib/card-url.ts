export const CARD_PARAM = "card";

/** The page URL with `cardId` as the open album card, or with no card when it is null. */
export function cardUrl(pathname: string, search: string, cardId: string | null): string {
  const params = new URLSearchParams(search);
  if (cardId === null) params.delete(CARD_PARAM);
  else params.set(CARD_PARAM, cardId);
  return params.size > 0 ? `${pathname}?${params}` : pathname;
}
