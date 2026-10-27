"use client";

import { AnimatePresence, motion } from "motion/react";
import { Dialog } from "radix-ui";
import type { ReactNode } from "react";
import { gameCn } from "./game-cn";
import { TRANSITION } from "./game-motion";

type GameModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Shown on the grey stage above the title, usually a large Sticker. */
  stage?: ReactNode;
  /** The actions row: GameButtons and links. */
  children?: ReactNode;
  className?: string;
};

/** Centered game dialog: a sticker on the stage, a big question and the actions. */
export function GameModal({
  open,
  onOpenChange,
  title,
  description,
  stage,
  children,
  className,
}: GameModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-game-ink/45"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={TRANSITION.fade}
              />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              forceMount
              {...(description ? {} : { "aria-describedby": undefined })}
            >
              <motion.div
                className={gameCn(
                  "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-120 max-w-[calc(100%-32px)] flex-col items-center gap-6 overflow-y-auto rounded-modal bg-game-surface p-8 text-center font-game-sans text-game-ink outline-none",
                  className,
                )}
                initial={{ opacity: 0, x: "-50%", y: "-46%" }}
                animate={{ opacity: 1, x: "-50%", y: "-50%" }}
                exit={{ opacity: 0, x: "-50%", y: "-48%" }}
                transition={TRANSITION.enter}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <Dialog.Title className="font-game-serif text-hero-md">{title}</Dialog.Title>
                  {description ? (
                    <Dialog.Description className="max-w-130 text-game-muted text-lead">
                      {description}
                    </Dialog.Description>
                  ) : null}
                </div>
                {children ? (
                  <div className="flex flex-wrap items-center justify-center gap-4">{children}</div>
                ) : null}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
