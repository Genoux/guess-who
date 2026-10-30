import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { GameCheckbox } from "./game-checkbox";

const meta = {
  title: "Game/Forms/GameCheckbox",
  component: GameCheckbox,
  tags: ["autodocs"],
  args: { "aria-label": "Select Sam Taylor", onCheckedChange: fn() },
} satisfies Meta<typeof GameCheckbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = { args: { defaultChecked: false } };
export const Checked: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };
