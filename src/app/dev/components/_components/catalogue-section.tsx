import type { ReactNode } from "react";

type CatalogueSectionProps = {
  number: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function CatalogueSection({ number, title, description, children }: CatalogueSectionProps) {
  const headingId = `section-${number}`;
  return (
    <section
      aria-labelledby={headingId}
      className="grid gap-8 border-game-border border-t py-10 md:grid-cols-[240px_minmax(0,1fr)]"
    >
      <div className="flex flex-col gap-2">
        <span className="font-game-mono text-caption text-game-muted uppercase">{number}</span>
        <h2 id={headingId} className="font-game-serif text-heading">
          {title}
        </h2>
        <p className="text-game-muted text-small">{description}</p>
      </div>
      <div className="flex min-w-0 flex-col gap-10">{children}</div>
    </section>
  );
}
