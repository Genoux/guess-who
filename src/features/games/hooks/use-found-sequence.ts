import { animate, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TRANSITION } from "@/shared/components/game/game-motion";
import { celebrate, originFromElement } from "@/shared/lib/celebrate";
import { wait } from "@/shared/lib/wait";
import { FOUND_TO_MIDDLE, REVEAL_BACK } from "../lib/album-motion";

export type FoundSequence = ReturnType<typeof useFoundSequence>;

/**
 * The right guess, played on the card itself. Call `clear` once the rest of the screen has faded:
 * the screen collapses around the card, which starts out where it stood, slides to the middle,
 * takes the stamp under the confetti, holds, and goes back up for the words.
 */
export function useFoundSequence() {
  const cardRef = useRef<HTMLDivElement>(null);
  const standingAt = useRef<DOMRect | null>(null);
  const started = useRef(false);
  const mounted = useRef(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const reduceMotion = useReducedMotion();
  const [cleared, setCleared] = useState(false);
  const [stamped, setStamped] = useState(false);
  const [told, setTold] = useState(false);

  const clear = () => {
    standingAt.current = cardRef.current?.getBoundingClientRect() ?? null;
    setCleared(true);
  };

  // Apart from the layout effect, whose `started` guard must not be reset by its own cleanup.
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Before paint: the collapse moves the card, and it must already be back where it stood.
  useLayoutEffect(() => {
    const card = cardRef.current;
    const from = standingAt.current;
    if (!cleared || !card || !from || started.current) return;
    started.current = true;
    const to = card.getBoundingClientRect();

    const play = async () => {
      if (!reduceMotion) {
        // Centres, not corners: the scale is about the centre.
        x.set(from.left + from.width / 2 - (to.left + to.width / 2));
        y.set(from.top + from.height / 2 - (to.top + to.height / 2));
        scale.set(from.width / to.width);
        const toMiddle = window.innerHeight / 2 - (to.top + to.height / 2);
        await Promise.all([
          animate(x, 0, FOUND_TO_MIDDLE),
          animate(y, toMiddle, FOUND_TO_MIDDLE),
          animate(scale, 1, FOUND_TO_MIDDLE),
        ]);
      }
      // Left mid-way (the page changed): the card is gone, and so must be its confetti.
      if (!mounted.current) return;
      setStamped(true);
      if (!reduceMotion) await wait(TRANSITION.stamp.duration);
      if (!mounted.current) return;
      void celebrate(originFromElement(card), { kind: "found", palette: "found" });
      if (!reduceMotion) await animate(y, 0, REVEAL_BACK);
      if (mounted.current) setTold(true);
    };
    void play();
  }, [cleared, reduceMotion, x, y, scale]);

  return { cardRef, x, y, scale, clear, cleared, stamped, told };
}
