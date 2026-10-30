import { UsersIcon } from "lucide-react";

type PeopleEmptyProps = { title: string; text: string };

export function PeopleEmpty({ title, text }: PeopleEmptyProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 pt-14 pb-12 text-center">
      <span
        aria-hidden
        className="mb-4.5 grid h-21 w-16 -rotate-4 place-items-center rounded-card border-2 border-game-muted border-dashed text-game-muted"
      >
        <UsersIcon className="size-4.5" />
      </span>
      <h2 className="font-game-serif text-title">{title}</h2>
      <p className="max-w-105 text-pretty text-game-muted">{text}</p>
    </div>
  );
}
