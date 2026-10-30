import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GameSearchField } from "./game-search-field";

const meta = {
  title: "Game/Forms/GameSearchField",
  component: GameSearchField,
  tags: ["autodocs"],
  args: { label: "Search people", placeholder: "Search people" },
} satisfies Meta<typeof GameSearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Typed: Story = { args: { defaultValue: "sam" } };
