"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { GameBook } from "@/shared/components/game/game-book";
import { GameButton } from "@/shared/components/game/game-button";
import { GameModal } from "@/shared/components/game/game-modal";
import { gameToast } from "@/shared/components/game/game-toaster";
import { Reveal } from "@/shared/components/game/reveal";
import { BOOK_DELAY_S } from "../lib/new-hire-motion";
import type { NewHireBoard, NewHireRowView } from "../lib/new-hire-view";
import { MissingCluesDialog } from "./missing-clues-dialog";
import { NewHireForm, type SavedNewHire } from "./new-hire-form";
import { NewHireRow } from "./new-hire-row";
import { RemoveNewHireDialog } from "./remove-new-hire-dialog";

type FormTarget = { row?: NewHireRowView } | null;

type NewHiresScreenProps = {
  board: NewHireBoard;
  /** Dev preview: nothing is saved. */
  preview?: boolean;
};

function EmptyBook() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 pt-14 pb-12 text-center">
      <span
        aria-hidden
        className="mb-4.5 grid h-21 w-16 -rotate-4 place-items-center rounded-card border-2 border-game-muted border-dashed text-game-muted"
      >
        <PlusIcon className="size-4.5" />
      </span>
      <h2 className="font-game-serif text-title">No new hires yet</h2>
      <p className="max-w-105 text-pretty text-game-muted">
        Deel adds them here when a contract is signed. For anyone who isn't in Deel, add them by
        hand.
      </p>
    </div>
  );
}

/** The New hires page: the list of games and the dialogs that add, edit and remove one. */
export function NewHiresScreen({ board, preview = false }: NewHiresScreenProps) {
  const [form, setForm] = useState<FormTarget>(null);
  const [removing, setRemoving] = useState<NewHireRowView | null>(null);
  const [freshId, setFreshId] = useState<string>();
  const [showingMissing, setShowingMissing] = useState(false);
  const { ready, total, missing } = board.readiness;

  function saved({ message, gameId }: SavedNewHire) {
    setForm(null);
    if (gameId) setFreshId(gameId);
    gameToast(message);
  }

  return (
    <>
      <Reveal className="flex flex-col items-center gap-1.5">
        <h1 className="font-game-serif text-hero-md md:text-hero">New hires</h1>
        <p className="max-w-130 text-game-muted text-lead">
          Deel adds them when a contract is signed.
        </p>
        <GameButton className="mt-5.5" onClick={() => setForm({})}>
          <PlusIcon aria-hidden className="size-4.5" />
          Add new hire
        </GameButton>
        <p className="flex flex-wrap items-center justify-center gap-x-3 text-game-muted text-small">
          {ready} of {total} teammates have their clues ready
          {missing.length > 0 ? (
            <GameButton variant="link" onClick={() => setShowingMissing(true)}>
              See who's missing
            </GameButton>
          ) : null}
        </p>
      </Reveal>

      <Reveal delay={BOOK_DELAY_S} className="flex w-full flex-col gap-8">
        {board.groups.length === 0 ? (
          <GameBook as="div" className="items-stretch gap-0 p-0 text-left">
            <EmptyBook />
          </GameBook>
        ) : (
          board.groups.map((group) => (
            <section key={group.key} aria-labelledby={`group-${group.key}`}>
              <GameBook
                as="div"
                className="hire-book items-stretch gap-4 px-5 pt-7 pb-5 text-left md:px-8 md:pt-9 md:pb-6"
              >
                <h2 id={`group-${group.key}`} className="font-game-serif text-heading">
                  {group.label}
                </h2>
                <ul className="flex flex-col gap-1">
                  {group.rows.map((row) => (
                    <NewHireRow
                      key={row.id}
                      row={row}
                      fresh={row.id === freshId}
                      onEdit={(target) => setForm({ row: target })}
                      onSettled={() => setFreshId(undefined)}
                    />
                  ))}
                </ul>
              </GameBook>
            </section>
          ))
        )}
      </Reveal>

      <GameModal
        open={form !== null}
        onOpenChange={(open) => !open && setForm(null)}
        title={form?.row ? "Edit this game" : "Add a new hire"}
        description={
          form?.row
            ? form.row.emailEditable
              ? "They haven't signed in yet, so the email can still be fixed."
              : "They've signed in, so only the first day and welcomer can change."
            : "Only for someone who isn't in Deel."
        }
      >
        <NewHireForm
          row={form?.row}
          today={board.today}
          preview={preview}
          onSaved={saved}
          onCancel={() => setForm(null)}
          onRemove={(target) => {
            setForm(null);
            setRemoving(target);
          }}
        />
      </GameModal>

      <MissingCluesDialog
        open={showingMissing}
        onOpenChange={setShowingMissing}
        missing={missing}
      />

      <RemoveNewHireDialog
        row={removing}
        preview={preview}
        onRemoved={() => {
          setRemoving(null);
          gameToast("Removed.");
        }}
        onClose={() => setRemoving(null)}
      />
    </>
  );
}
