"use client";

import { useState } from "react";
import { GameButton } from "@/shared/components/game/game-button";
import { GameModal } from "@/shared/components/game/game-modal";

/** The guess modal: answering "yes" for the wrong person rules them out. */
export function ModalDemo() {
  const [open, setOpen] = useState(false);
  const [wrong, setWrong] = useState(false);

  const openModal = () => {
    setWrong(false);
    setOpen(true);
  };

  return (
    <>
      <GameButton size="lg" onClick={openModal}>
        Guess Jonah
      </GameButton>
      <GameModal
        open={open}
        onOpenChange={setOpen}
        title={wrong ? "Not Jonah." : "Is it Jonah?"}
        description={
          wrong
            ? "One less suspect. Clue 3 lands in 3 days."
            : "If not, Jonah is out. You can keep guessing."
        }
      >
        {wrong ? (
          <GameButton variant="yellow" onClick={() => setOpen(false)}>
            Back to mission
          </GameButton>
        ) : (
          <>
            <GameButton onClick={() => setWrong(true)}>Yes, it’s Jonah</GameButton>
            <GameButton variant="link" onClick={() => setOpen(false)}>
              Not sure yet
            </GameButton>
          </>
        )}
      </GameModal>
    </>
  );
}
