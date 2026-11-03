import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { GameButton } from "./game-button";
import { GameModal } from "./game-modal";

const meta = {
  title: "Game/Feedback/GameModal",
  component: GameModal,
  parameters: { layout: "fullscreen" },
  args: {
    open: true,
    onOpenChange: fn(),
    title: "Is it Jonah?",
    description: "If not, Jonah is out. You can keep guessing.",
    children: (
      <>
        <GameButton>Yes, it’s Jonah</GameButton>
        <GameButton variant="link">Not sure yet</GameButton>
      </>
    ),
  },
} satisfies Meta<typeof GameModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Guess: Story = {};

export const Leave: Story = {
  args: {
    title: "Leave the game?",
    description: "Your album stays as it is.",
  },
};

export const WithoutDescription: Story = {
  args: { description: undefined, title: "Ready to reveal?" },
};

export const Interactive: Story = {
  args: { open: false },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="flex min-h-screen items-center justify-center">
        <GameButton onClick={() => setOpen(true)}>Guess Jonah</GameButton>
        <GameModal {...args} open={open} onOpenChange={setOpen}>
          <GameButton onClick={() => setOpen(false)}>Close</GameButton>
        </GameModal>
      </div>
    );
  },
};
