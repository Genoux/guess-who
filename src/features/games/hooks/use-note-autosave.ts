"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gameToast } from "@/shared/components/game/game-toaster";
import { saveNote } from "../actions/save-note";
import { saveNoteSchema } from "../schemas";

export type AutosaveStatus = "idle" | "saving" | "saved";

const DEBOUNCE_MS = 800;

/**
 * Saves a collected sticker's note a beat after typing stops, on blur, and when the field
 * unmounts (closing the card mid-sentence still keeps the words). An empty or too long note
 * waits silently while typing and only reports its error on blur.
 */
export function useNoteAutosave(personId: string, saved: string) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [error, setError] = useState<string>();
  const lastSaved = useRef(saved);
  const draft = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const flush = useCallback(
    async (reportErrors: boolean) => {
      clearTimeout(timer.current);
      const note = draft.current;
      if (note === null || note.trim() === lastSaved.current) return;
      const parsed = saveNoteSchema.safeParse({ personId, note });
      if (!parsed.success) {
        if (reportErrors) setError(parsed.error.issues[0]?.message);
        return;
      }
      const previous = lastSaved.current;
      draft.current = null;
      lastSaved.current = parsed.data.note;
      setError(undefined);
      setStatus("saving");
      const result = await saveNote(parsed.data);
      if (!result.ok) {
        lastSaved.current = previous;
        draft.current ??= note;
        setStatus("idle");
        gameToast(result.error);
        return;
      }
      setStatus("saved");
    },
    [personId],
  );

  useEffect(() => () => void flush(false), [flush]);

  const change = (note: string) => {
    draft.current = note;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(false), DEBOUNCE_MS);
  };

  return { status, error, change, blur: () => void flush(true) };
}
