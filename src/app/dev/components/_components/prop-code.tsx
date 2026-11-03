import type { ReactNode } from "react";

const BASE = "rounded px-1.5 py-0.5 font-game-mono text-caption leading-4 tracking-normal";

/** The prop name or value under a catalogue example. */
export function PropCode({ children, onDark = false }: { children: ReactNode; onDark?: boolean }) {
  return (
    <code
      className={`${BASE} ${onDark ? "bg-game-ink-soft text-game-border-strong" : "bg-game-hover text-game-muted"}`}
    >
      {children}
    </code>
  );
}
