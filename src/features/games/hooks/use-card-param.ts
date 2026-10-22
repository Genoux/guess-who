"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CARD_PARAM, cardUrl } from "../lib/card-url";

/**
 * The open album card, mirrored in `?card=<id>` so Back closes it and a link reopens it. The card
 * opens from local state on the click itself; waiting for the router to echo the URL back through
 * `useSearchParams` cost a few frames before the flight could start.
 */
export function useCardParam() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlCardId = searchParams.get(CARD_PARAM);
  const [cardId, setCardId] = useState(urlCardId);
  const pushedByUs = useRef(false);

  // Back, Forward and direct links change the URL first; follow them.
  useEffect(() => {
    setCardId(urlCardId);
    if (urlCardId === null) pushedByUs.current = false;
  }, [urlCardId]);

  const open = useCallback(
    (id: string) => {
      setCardId(id);
      window.history.pushState(null, "", cardUrl(pathname, searchParams.toString(), id));
      pushedByUs.current = true;
    },
    [pathname, searchParams],
  );

  // Back only when we pushed the entry; a card opened from a direct link would leave the app.
  const close = useCallback(() => {
    setCardId(null);
    if (pushedByUs.current) {
      window.history.back();
      return;
    }
    window.history.replaceState(null, "", cardUrl(pathname, searchParams.toString(), null));
  }, [pathname, searchParams]);

  return { cardId, open, close };
}
