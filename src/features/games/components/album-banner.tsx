import Link from "next/link";
import { GameButton } from "@/shared/components/game/game-button";

type AlbumBannerProps = {
  href: string;
  /** Yellow mono line, e.g. "New clue". */
  eyebrow: string;
  title: string;
  cta: string;
};

/** The ink pill above the album: a clue that just landed, or how the game ended. */
export function AlbumBanner({ href, eyebrow, title, cta }: AlbumBannerProps) {
  return (
    <Link
      href={href}
      className="flex w-full max-w-150 flex-wrap items-center justify-between gap-4 rounded-3xl bg-game-ink px-5 py-4 sm:gap-6 xs:rounded-full sm:pr-4 sm:pl-7 text-white no-underline outline-none transition-transform duration-fast ease-game focus-visible:outline-2 focus-visible:outline-game-found focus-visible:outline-offset-4 motion-reduce:transition-none motion-reduce:hover:scale-100"
    >
      <span className="flex flex-col gap-0.5 text-left">
        <span className="font-game-mono text-caption text-game-shortlist uppercase">{eyebrow}</span>
        <span className="font-game-serif text-clue">{title}</span>
      </span>
      <GameButton asChild variant="on-dark" size="sm">
        <span>{cta}</span>
      </GameButton>
    </Link>
  );
}
