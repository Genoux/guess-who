import { z } from "zod";
import type { StickerMode } from "@/shared/components/game/sticker-view";

export const CARD_PARAM = "card";

/** The page URL with `cardId` as the open album card, or with no card when it is null. */
export function cardUrl(pathname: string, search: string, cardId: string | null): string {
  const params = new URLSearchParams(search);
  if (cardId === null) params.delete(CARD_PARAM);
  else params.set(CARD_PARAM, cardId);
  return params.size > 0 ? `${pathname}?${params}` : pathname;
}

const cardParamSchema = z.uuid();

/** The card a link opens the album on: a uuid of a sticker the viewer has collected, else null. */
export function openingCardId(
  param: string | string[] | undefined,
  stickers: readonly { id: string; mode: StickerMode }[],
): string | null {
  const parsed = cardParamSchema.safeParse(param);
  if (!parsed.success) return null;
  const sticker = stickers.find(({ id }) => id === parsed.data);
  return sticker && sticker.mode !== "locked" ? sticker.id : null;
}
