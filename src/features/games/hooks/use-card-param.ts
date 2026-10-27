"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CARD_PARAM, cardUrl } from "../lib/card-url";

/**
 * The open album card, mirrored in `?card=<id>` so Back closes it. The card opens from local state
 * on the click itself; waiting for the router to echo the URL back through `useSearchParams` cost a
 * few frames before the flight could start.
 */
export function useCardParam() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlCardId = searchParams.get(CARD_PARAM);
  const [cardId, setCardId] = useState<string | null>(null);
  const pushedByUs = useRef(false);
  const scrollAtOpen = useRef<number | null>(null);

  useEffect(() => {
    if (urlCardId === null) {
      // Back changed the URL first; follow it.
      setCardId(null);
      pushedByUs.current = false;
      scrollAtOpen.current = null;
    } else if (!pushedByUs.current) {
      // A card is a popup over the album, not a page: a reload, a shared link or Forward lands on
      // the album. Opening it there drew the album first, then the popup over it.
      window.history.replaceState(null, "", cardUrl(pathname, searchParams.toString(), null));
    }
  }, [urlCardId, pathname, searchParams]);

  const open = useCallback(
    (id: string) => {
      setCardId(id);
      scrollAtOpen.current = window.scrollY;
      window.history.pushState(null, "", cardUrl(pathname, searchParams.toString(), id));
      pushedByUs.current = true;
    },
    [pathname, searchParams],
  );

  const close = useCallback(() => {
    // A refresh while the card is open (collecting revalidates the album) scrolls the page under it
    // to the top: Next 16.3 gets back a page segment keyed with `?card`, which pushState kept out of
    // its tree, and treats it as new. Back restores the scroll only after the card has measured its
    // flight home, which then starts a scroll's height off, so the scroll goes back first.
    if (scrollAtOpen.current !== null) {
      window.scrollTo({ top: scrollAtOpen.current, behavior: "instant" });
      scrollAtOpen.current = null;
    }
    setCardId(null);
    window.history.back();
  }, []);

  return { cardId, open, close };
}
