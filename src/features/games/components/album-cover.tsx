"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { type ReactNode, useLayoutEffect, useRef } from "react";

const COVERED_SCALE = 0.9;

type AlbumCoverProps = {
  children: ReactNode;
};

/**
 * The title and banner over the album. It holds its place while the album page slides up over it,
 * shrinking back and fading out as it is covered. The page after it must be positioned to paint on top.
 */
export function AlbumCover({ children }: AlbumCoverProps) {
  const coverRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const covered = useTransform(scrollY, (scrolled) => {
    const height = coverRef.current?.offsetHeight ?? 1;
    return Math.min(1, Math.max(0, scrolled / height));
  });
  const opacity = useTransform(covered, [0, 1], [1, 0]);
  const scale = useTransform(covered, [0, 1], [1, COVERED_SCALE]);

  // Sticking where it rests keeps the cover still from the first pixel of scroll. That place
  // depends on the nav's height, which wraps on a phone, so it is measured rather than hardcoded.
  useLayoutEffect(() => {
    const cover = coverRef.current;
    if (!cover) return;
    const pinToRest = () => {
      // A stuck box reports where it is stuck, so read the resting place with sticky switched off.
      cover.style.position = "static";
      const restTop = cover.getBoundingClientRect().top + window.scrollY;
      cover.style.position = "";
      cover.style.top = `${restTop}px`;
    };
    pinToRest();
    const observer = new ResizeObserver(pinToRest);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      ref={coverRef}
      style={{ opacity, scale: reduceMotion ? 1 : scale }}
      className="sticky flex w-full flex-col items-center gap-10"
    >
      {children}
    </motion.div>
  );
}
