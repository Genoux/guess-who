"use client";

import { Button } from "@inbeat/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@inbeat/ui/components/sheet";
import { Spinner } from "@inbeat/ui/components/spinner";
import { Tabs, TabsList } from "@inbeat/ui/components/tabs";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { applyDevState } from "../actions/apply-dev-state";
import { DEV_SCENARIO_IDS, DEV_SCENARIOS, devScenarioSteps } from "../lib/dev-state";

/** Dev-only: puts the signed-in tester into one real situation of the game, then opens it. */
export function DevPanel() {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(DEV_SCENARIO_IDS[0]);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const apply = () => {
    const scenario = selectedId;
    startTransition(async () => {
      const result = await applyDevState({ scenario });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setOpen(false);
      router.push(DEV_SCENARIOS[scenario].landing);
      router.refresh();
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="fixed bottom-4 left-4 z-[60] rounded-full shadow-lg">
          Dev state
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="z-[70] flex flex-col gap-0 overflow-y-auto font-sans">
        <SheetHeader>
          <SheetTitle>Dev state</SheetTitle>
          <SheetDescription>
            Puts your own game and card into one real situation, then opens it.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-4 pb-4">
          {devScenarioSteps(selectedId).map(({ step, value, options }) => (
            <section key={step} className="flex flex-col gap-2">
              <h3 className="font-medium text-muted-foreground text-xs uppercase">{step}</h3>
              <Tabs
                value={value}
                onValueChange={(label) => {
                  const option = options.find((candidate) => candidate.label === label);
                  if (option) setSelectedId(option.id);
                }}
              >
                <TabsList
                  tabs={options.map(({ label }) => ({ value: label, label }))}
                  className="flex-wrap"
                />
              </Tabs>
            </section>
          ))}
          <p className="text-muted-foreground text-sm">{DEV_SCENARIOS[selectedId].hint}</p>
        </div>
        <SheetFooter className="mt-auto">
          <Button onClick={apply} disabled={pending} className="rounded-full">
            {pending ? <Spinner /> : null}
            {pending ? "Applying…" : "Apply"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
