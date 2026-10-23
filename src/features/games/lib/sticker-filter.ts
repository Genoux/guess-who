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
