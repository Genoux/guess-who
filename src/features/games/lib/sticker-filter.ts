import type { StickerMode } from "@/shared/components/game/sticker-view";

export const STICKER_FILTERS = [
  { value: "all", label: "All stickers" },
  { value: "collected", label: "Collected" },
  { value: "locked", label: "Not met yet" },
  { value: "maybe", label: "Maybe" },
  { value: "ruled", label: "Ruled out" },
] as const;

export type StickerFilter = (typeof STICKER_FILTERS)[number]["value"];

type FilterableSticker = { mode: StickerMode; collected: boolean };

export function matchesStickerFilter(sticker: FilterableSticker, filter: StickerFilter): boolean {
  if (filter === "all") return true;
  if (filter === "collected") return sticker.collected;
  return sticker.mode === filter;
}

/** The `?show=` param of an album link, so a link can open the album already filtered. */
export const STICKER_FILTER_PARAM = "show";

export function parseStickerFilter(value: string | string[] | undefined): StickerFilter {
  return STICKER_FILTERS.find((filter) => filter.value === value)?.value ?? "all";
}
