import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CloseButton } from "./close-button";

const TONES = ["light", "dark", "on-color", "subtle", "outline"] as const;

const meta = {
  title: "Game/Controls/CloseButton",
  component: CloseButton,
  tags: ["autodocs"],
  args: { label: "Close", tone: "light" },
  argTypes: { tone: { control: "inline-radio", options: TONES } },
} satisfies Meta<typeof CloseButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const OnInk: Story = {
  args: { tone: "dark" },
  globals: { backgrounds: { value: "ink" } },
};
export const OnFound: Story = {
  args: { tone: "on-color" },
  globals: { backgrounds: { value: "found" } },
};
