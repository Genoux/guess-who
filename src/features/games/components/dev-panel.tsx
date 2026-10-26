"use client";

import { useSession } from "@clerk/nextjs";
import { Button } from "@inbeat/ui/components/button";
import { Label } from "@inbeat/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@inbeat/ui/components/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@inbeat/ui/components/sheet";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { ROUTES } from "@/shared/config/routes";
import { applyDevState } from "../actions/apply-dev-state";
import {
  DEV_STATE_DEFAULT,
  type DevState,
  devFieldEnabled,
  devOptionDisabled,
  normalizeDevState,
} from "../lib/dev-state";
import { clueDay } from "../lib/game-clues";
import { CLUE_NUMBERS, GAME_DAYS } from "../lib/game-schedule";

type DevField<Key extends keyof DevState = keyof DevState> = {
  key: Key;
  label: string;
  options: { label: string; value: DevState[Key] }[];
};

const dayLabel = (day: number) => {
  const clue = CLUE_NUMBERS.find((number) => clueDay(number) === day);
  return clue ? `Day ${day} · clue ${clue} lands` : `Day ${day}`;
};

const FIELDS: DevField[] = [
  {
    key: "view",
    label: "View",
    options: [
      { label: "New hire", value: "new-hire" },
      { label: "Secret welcomer", value: "welcomer" },
      { label: "Teammate", value: "teammate" },
    ],
  },
  {
    key: "role",
    label: "Role",
    options: [
      { label: "Member", value: "member" },
      { label: "Admin", value: "admin" },
    ],
  },
  {
    key: "outcome",
    label: "Game",
    options: [
      { label: "In play", value: "active" },
      { label: "Welcomer found", value: "found" },
      { label: "Revealed on day 14", value: "revealed" },
    ],
  },
  {
    key: "day",
    label: "Day",
    options: Array.from({ length: GAME_DAYS }, (_, index) => ({
      label: dayLabel(index + 1),
      value: index + 1,
    })),
  },
  {
    key: "cluesWritten",
    label: "Clues the welcomer wrote",
    options: ["None", "Clue 2", "Clues 2 and 3", "Clues 2 to 4"].map((label, count) => ({
      label,
      value: count,
    })),
  },
  {
    key: "cluesRead",
    label: "Clues the new hire opened",
    options: [0, 1, 2, 3, 4].map((count) => ({
      label: count === 0 ? "None" : `Up to clue ${count}`,
      value: count,
    })),
  },
  {
    key: "album",
    label: "Album",
    options: [
      { label: "Empty", value: "empty" },
      { label: "5 stickers, 2 maybes, 1 not them", value: "started" },
    ],
  },
  {
    key: "introSeen",
    label: "Welcome tour",
    options: [
      { label: "Not seen yet", value: false },
      { label: "Seen", value: true },
    ],
  },
  {
    key: "card",
    label: "Their own sticker card",
    options: [
      { label: "Empty", value: "empty" },
      { label: "Filled", value: "filled" },
    ],
  },
];

const LANDING: Record<DevState["view"], string> = {
  "new-hire": ROUTES.play,
  welcomer: ROUTES.welcomer,
  teammate: ROUTES.home,
};

const STORAGE_KEY = "dev-state";

function readStoredState(): DevState {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEV_STATE_DEFAULT, ...JSON.parse(stored) } : DEV_STATE_DEFAULT;
  } catch {
    return DEV_STATE_DEFAULT;
  }
}

function storeState(state: DevState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private windows can refuse storage; the panel then starts from the default next time.
  }
}

/** Dev-only: sets the signed-in tester's role, game and card to any state the app can be in. */
export function DevPanel() {
  const [state, setState] = useState(DEV_STATE_DEFAULT);
  const [pending, startTransition] = useTransition();
  const { session } = useSession();
  const router = useRouter();

  useEffect(() => setState(readStoredState()), []);

  const change = (key: keyof DevState, index: string) => {
    const field = FIELDS.find((candidate) => candidate.key === key);
    const option = field?.options[Number(index)];
    if (!option) return;
    setState((current) => normalizeDevState({ ...current, [key]: option.value }));
  };

  const apply = () => {
    startTransition(async () => {
      const result = await applyDevState(state);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      storeState(state);
      // The role lives in the session token; fetch a fresh one so the server sees it.
      await session?.getToken({ skipCache: true });
      router.push(LANDING[state.view]);
      router.refresh();
      toast.success("Dev state applied");
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" className="fixed bottom-4 left-4 z-[60] rounded-full shadow-lg">
          Dev state
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="z-[70] flex flex-col gap-0 overflow-y-auto font-sans">
        <SheetHeader>
          <SheetTitle>Dev state</SheetTitle>
          <SheetDescription>
            Rewrites your own games, card and role. Options that cannot happen together are greyed
            out.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-4">
          {FIELDS.map((field) => {
            const enabled = devFieldEnabled(state, field.key);
            const selected = field.options.findIndex((option) => option.value === state[field.key]);
            return (
              <div key={field.key} className="flex flex-col gap-1.5">
                <Label htmlFor={`dev-${field.key}`} className={enabled ? "" : "opacity-50"}>
                  {field.label}
                </Label>
                <Select
                  value={String(selected)}
                  onValueChange={(index) => change(field.key, index)}
                  disabled={!enabled || pending}
                >
                  <SelectTrigger id={`dev-${field.key}`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[80]">
                    {field.options.map((option, index) => (
                      <SelectItem
                        key={option.label}
                        value={String(index)}
                        disabled={devOptionDisabled(state, field.key, option.value)}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
        <SheetFooter className="mt-auto">
          <Button onClick={apply} disabled={pending} className="rounded-full">
            {pending ? "Applying…" : "Apply"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
