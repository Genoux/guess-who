import type { ReactNode } from "react";

/** The prop name or value under a catalogue example. */
export function PropCode({ children, onDark = false }: { children: ReactNode; onDark?: boolean }) {
  return (
    <code
      className={
        onDark
          ? "rounded bg-game-ink-soft px-1.5 py-0.5 font-game-mono text-caption text-game-border-strong leading-4 tracking-normal"
          : "rounded bg-game-hover px-1.5 py-0.5 font-game-mono text-caption text-game-muted leading-4 tracking-normal"
      }
    >
      {children}
    </code>
  );
}
