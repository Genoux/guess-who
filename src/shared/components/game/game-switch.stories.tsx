import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { GameSwitch } from "./game-switch";

const meta = {
  title: "Game/Forms/GameSwitch",
  component: GameSwitch,
  tags: ["autodocs"],
  args: { "aria-label": "Could be my welcomer", onCheckedChange: fn() },
} satisfies Meta<typeof GameSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = { args: { defaultChecked: false } };
export const On: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };
