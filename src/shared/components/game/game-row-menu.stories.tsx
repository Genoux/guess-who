import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { GameRowMenu } from "./game-row-menu";

const meta = {
  title: "Game/Navigation/GameRowMenu",
  component: GameRowMenu,
  tags: ["autodocs"],
  args: { label: "Actions for Maya Chen" },
} satisfies Meta<typeof GameRowMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OneAction: Story = { args: { items: [{ label: "End mission", onSelect: fn() }] } };
export const TwoActions: Story = {
  args: {
    items: [
      { label: "Change email", onSelect: fn() },
      { label: "Turn off", onSelect: fn() },
    ],
  },
};
