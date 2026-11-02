"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CARD_PARAM, cardUrl } from "../lib/card-url";

/**
 * The open album card, mirrored in `?card=<id>` so Back closes it. The card opens from local state
 * on the click itself; waiting for the router to echo the URL back through `useSearchParams` cost a
 * few frames before the flight could start.
 */
export function useCardParam(initialCardId: string | null = null) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlCardId = searchParams.get(CARD_PARAM);
  const [cardId, setCardId] = useState<string | null>(initialCardId);
  const pushedByUs = useRef(false);
  const openedByLink = useRef(initialCardId !== null);
  const scrollAtOpen = useRef<number | null>(null);
  // Our `history.back()` is queued until the URL loses `?card`; a second close in that window
  // would step back again and leave the album, and a push would land under the pending back.
  const backPending = useRef(false);
  const openAfterBack = useRef<string | null>(null);
  // The back can land before a second close arrives (the overlay stays mounted while the card
  // flies home), so `backPending` alone is not enough: a close with no card open is nothing to do.
  const cardOpen = useRef(initialCardId !== null);

  useEffect(() => {
    if (urlCardId === null) {
      backPending.current = false;
      const reopen = openAfterBack.current;
      if (reopen !== null) {
        openAfterBack.current = null;
        window.history.pushState(null, "", cardUrl(pathname, searchParams.toString(), reopen));
        pushedByUs.current = true;
        return;
      }
      // Back changed the URL first; follow it.
      setCardId(null);
      cardOpen.current = false;
      pushedByUs.current = false;
      scrollAtOpen.current = null;
    } else if (!pushedByUs.current && urlCardId !== initialCardId) {
      // A card is a popup over the album, not a page: Forward, or a link the album could not
      // resolve to a collected card, lands on the album. Opening it there drew the album first,
      // then the popup over it. A card the server resolved (`initialCardId`) opens with the page.
      window.history.replaceState(null, "", cardUrl(pathname, searchParams.toString(), null));
    }
  }, [urlCardId, initialCardId, pathname, searchParams]);

  const open = useCallback(
    (id: string) => {
      setCardId(id);
      cardOpen.current = true;
      scrollAtOpen.current = window.scrollY;
      if (backPending.current) {
        openAfterBack.current = id;
        return;
      }
      window.history.pushState(null, "", cardUrl(pathname, searchParams.toString(), id));
      pushedByUs.current = true;
    },
    [pathname, searchParams],
  );

  const close = useCallback(() => {
    openAfterBack.current = null;
    if (!cardOpen.current) return;
    cardOpen.current = false;
    if (backPending.current) {
      setCardId(null);
      return;
    }
    // A refresh while the card is open (collecting revalidates the album) scrolls the page under it
    // to the top: Next 16.3 gets back a page segment keyed with `?card`, which pushState kept out of
    // its tree, and treats it as new. Back restores the scroll only after the card has measured its
    // flight home, which then starts a scroll's height off, so the scroll goes back first.
    if (scrollAtOpen.current !== null) {
      window.scrollTo({ top: scrollAtOpen.current, behavior: "instant" });
      scrollAtOpen.current = null;
    }
    setCardId(null);
    if (openedByLink.current) {
      // A link opened it: no entry of ours to step back over, and Back must still leave the page.
      openedByLink.current = false;
      window.history.replaceState(null, "", cardUrl(pathname, searchParams.toString(), null));
    } else {
      backPending.current = true;
      window.history.back();
    }
  }, [pathname, searchParams]);

  return { cardId, open, close };
}
