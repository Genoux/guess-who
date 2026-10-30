"use client";

import { fail, ok, type Result } from "@inbeat/core/result";
import { PlusIcon } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { GameButton } from "@/shared/components/game/game-button";
import { GameModal } from "@/shared/components/game/game-modal";
import { gameToast } from "@/shared/components/game/game-toaster";
import { PillTabs } from "@/shared/components/game/pill-tabs";
import { Reveal } from "@/shared/components/game/reveal";
import { addNewHire } from "../actions/add-new-hire";
import { changeInviteEmail } from "../actions/change-invite-email";
import { endMission } from "../actions/end-mission";
import { setAsNewHire } from "../actions/set-as-new-hire";
import { turnOnMissions } from "../actions/turn-on-missions";
import { firstName } from "../lib/first-name";
import { BOOK_DELAY_S } from "../lib/people-motion";
import { applyPeopleMove, type PeopleMove } from "../lib/people-moves";
import type { NoMissionRowView, PeopleBoard, PlayingRowView } from "../lib/people-view";
import { EndMissionDialog } from "./end-mission-dialog";
import { NewHireEmailForm } from "./new-hire-email-form";
import { PeopleDone } from "./people-done";
import { PeopleNoMission } from "./people-no-mission";
import { PeoplePlaying } from "./people-playing";
import { SetNewHireDialog } from "./set-new-hire-dialog";

type PeopleView = "playing" | "noMission" | "done";

type EmailDialog = { invite?: PlayingRowView } | null;

type PeopleScreenProps = {
  board: PeopleBoard;
  /** Dev preview: nothing is saved, so the page moves people itself. */
  preview?: boolean;
  /** Preview only: how long a pretend action takes, to watch the optimistic move. */
  previewDelayMs?: number;
  /** Preview only: every pretend action is refused, to watch the move roll back. */
  previewRefuses?: boolean;
};

const shortName = (row: { name: string | null; email: string }) =>
  row.name ? firstName(row.name) : row.email;

async function pretend<Data>(data: Data, delayMs: number, refuse: boolean): Promise<Result<Data>> {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  return refuse ? fail("The server said no.", "conflict") : ok(data);
}

type Action<Data> = {
  move: PeopleMove;
  /** The server call; the preview answers with `previewData` instead. */
  run: () => Promise<Result<Data>>;
  previewData: Data;
  message: (data: Data) => string;
};

/**
 * The People page: who is playing, who has no mission, and who is done. Every action moves the
 * person to their new tab at once; the server's answer then confirms it (the
 * page refreshes) or rolls it back with the reason.
 */
export function PeopleScreen({
  board: serverBoard,
  preview = false,
  previewDelayMs = 0,
  previewRefuses = false,
}: PeopleScreenProps) {
  const [view, setView] = useState<PeopleView>("playing");
  const [emailDialog, setEmailDialog] = useState<EmailDialog>(null);
  const [ending, setEnding] = useState<PlayingRowView | null>(null);
  const [choosing, setChoosing] = useState<NoMissionRowView | null>(null);
  // Nothing is saved in the preview, so its settled board is kept here.
  const [previewBoard, setPreviewBoard] = useState(serverBoard);
  const [board, applyMove] = useOptimistic(preview ? previewBoard : serverBoard, applyPeopleMove);
  const [, startTransition] = useTransition();

  const tab = (value: PeopleView, label: string, count: number) => ({
    label,
    count,
    current: view === value,
    onSelect: () => setView(value),
  });

  function perform<Data>({ move, run, previewData, message }: Action<Data>) {
    startTransition(async () => {
      applyMove(move);
      const result: Result<Data> = preview
        ? await pretend(previewData, previewDelayMs, previewRefuses)
        : await run();
      if (!result.ok) {
        gameToast(result.error);
        return;
      }
      if (preview) setPreviewBoard((current) => applyPeopleMove(current, move));
      gameToast(message(result.data));
    });
  }

  function turnOn(keys: readonly string[]) {
    const who = keys.length === 1 ? board.noMission.find(({ key }) => key === keys[0]) : undefined;
    perform({
      move: { type: "turnOn", keys },
      run: () => turnOnMissions({ personIds: [...keys] }),
      previewData: { started: keys.length, skippedNoWelcomer: 0 },
      message: ({ started, skippedNoWelcomer }) => {
        if (started + skippedNoWelcomer === 0) {
          return "Nobody was started. They need a card and clues first.";
        }
        if (started === 0) return "No mission could start: no free welcomer.";
        const startedText = who
          ? `${shortName(who)}'s mission started.`
          : `Started ${started} ${started === 1 ? "mission" : "missions"}.`;
        return skippedNoWelcomer === 0
          ? startedText
          : `${startedText} ${skippedNoWelcomer} couldn't start: no free welcomer.`;
      },
    });
  }

  function setNewHire(row: NoMissionRowView, startMission: boolean) {
    setChoosing(null);
    perform({
      move: { type: startMission ? "setNewHire" : "flagNewHire", key: row.key },
      run: () => setAsNewHire({ personId: row.key, startMission }),
      previewData: { gameId: startMission ? `pending-${row.key}` : null },
      message: () =>
        startMission
          ? `${shortName(row)} is now a new hire. Their mission started.`
          : `${shortName(row)} is now a new hire. Turn on their mission when it's time.`,
    });
  }

  function end(row: PlayingRowView) {
    setEnding(null);
    perform({
      move: { type: "end", gameId: row.gameId },
      run: () => endMission({ gameId: row.gameId }),
      previewData: undefined,
      message: () => `${shortName(row)}'s mission ended.`,
    });
  }

  function submitEmail(email: string) {
    const invite = emailDialog?.invite;
    setEmailDialog(null);
    if (invite) {
      perform({
        move: { type: "changeEmail", gameId: invite.gameId, email },
        run: () => changeInviteEmail({ gameId: invite.gameId, email }),
        previewData: undefined,
        message: () => "Saved.",
      });
      return;
    }
    setView("playing");
    perform({
      move: { type: "add", email },
      run: () => addNewHire({ email }),
      previewData: undefined,
      message: () => "Added. Their mission started.",
    });
  }

  return (
    <>
      <Reveal className="flex w-full flex-wrap items-center justify-between gap-4">
        <h1 className="font-game-serif text-hero-md md:text-hero">People</h1>
        <GameButton onClick={() => setEmailDialog({})}>
          <PlusIcon aria-hidden className="size-4.5" />
          Add new hire
        </GameButton>
      </Reveal>

      <Reveal delay={BOOK_DELAY_S} className="flex w-full flex-1 flex-col gap-5">
        <PillTabs
          tone="page"
          label="People views"
          tabs={[
            tab("playing", "Playing", board.playing.length),
            tab("noMission", "No mission", board.noMission.length),
            tab("done", "Done", board.done.length),
          ]}
        />
        {view === "playing" ? (
          <PeoplePlaying
            rows={board.playing}
            onEnd={setEnding}
            onChangeEmail={(invite) => setEmailDialog({ invite })}
          />
        ) : null}
        {view === "noMission" ? (
          <PeopleNoMission rows={board.noMission} onTurnOn={turnOn} onSetNewHire={setChoosing} />
        ) : null}
        {view === "done" ? <PeopleDone rows={board.done} /> : null}
      </Reveal>

      <GameModal
        open={emailDialog !== null}
        onOpenChange={(open) => !open && setEmailDialog(null)}
        title={emailDialog?.invite ? "Change email" : "Add new hire"}
      >
        <NewHireEmailForm
          key={emailDialog?.invite?.gameId ?? "new"}
          invite={emailDialog?.invite}
          onSubmit={submitEmail}
          onCancel={() => setEmailDialog(null)}
        />
      </GameModal>

      <SetNewHireDialog row={choosing} onChoose={setNewHire} onClose={() => setChoosing(null)} />

      <EndMissionDialog row={ending} onEnd={end} onClose={() => setEnding(null)} />
    </>
  );
}
