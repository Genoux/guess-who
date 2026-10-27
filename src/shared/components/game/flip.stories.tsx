import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { Flip } from "./flip";
import { GameButton } from "./game-button";
import { DURATION } from "./game-motion";

const meta = {
  title: "Game/Motion/Flip",
  component: Flip,
  tags: ["autodocs"],
  args: {
    flipped: false,
    className: "h-62 w-44",
    onFlipped: fn(),
    front: (
      <div className="flex size-full items-center justify-center rounded-card bg-game-ink text-white">
        Front
      </div>
    ),
    back: (
      <div className="flex size-full items-center justify-center rounded-card bg-game-shortlist text-game-ink">
        Back
      </div>
    ),
  },
} satisfies Meta<typeof Flip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Flipped: Story = { args: { flipped: true } };
export const Delayed: Story = { args: { delay: DURATION.slower } };

export const Interactive: Story = {
  render: (args) => {
    const [flipped, setFlipped] = useState(false);
    return (
      <div className="flex flex-col items-center gap-8">
        <Flip {...args} flipped={flipped} />
        <GameButton size="sm" onClick={() => setFlipped((value) => !value)}>
          Turn the card
        </GameButton>
      </div>
    );
  },
};
