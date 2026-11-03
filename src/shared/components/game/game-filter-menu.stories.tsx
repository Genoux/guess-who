import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { GameFilterMenu } from "./game-filter-menu";

const OPTIONS = [
  { value: "all", label: "All stickers", count: 23 },
  { value: "collected", label: "Collected", count: 7 },
  { value: "locked", label: "Not met yet", count: 16 },
  { value: "maybe", label: "Maybe", count: 2 },
  { value: "ruled", label: "Ruled out", count: 1 },
] as const;

type Value = (typeof OPTIONS)[number]["value"];

function Sample({ initial }: { initial: Value }) {
  const [value, setValue] = useState<Value>(initial);
  return <GameFilterMenu label="Show" value={value} options={OPTIONS} onValueChange={setValue} />;
}

const meta = {
  title: "Game/Forms/GameFilterMenu",
  component: Sample,
  args: { initial: "all" },
  argTypes: { initial: { control: "inline-radio", options: OPTIONS.map((o) => o.value) } },
} satisfies Meta<typeof Sample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unfiltered: Story = {};
export const Filtering: Story = { args: { initial: "maybe" } };
