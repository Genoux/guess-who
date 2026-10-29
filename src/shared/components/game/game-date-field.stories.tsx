import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { GameDateField } from "./game-date-field";

const meta = {
  title: "Game/Forms/GameDateField",
  component: GameDateField,
  tags: ["autodocs"],
  args: { label: "First day", value: "2026-11-02", onValueChange: () => {}, min: "2026-10-28" },
  decorators: [
    (Story) => (
      <div className="h-96 w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GameDateField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <GameDateField {...args} value={value} onValueChange={setValue} />;
  },
};
export const Empty: Story = { args: { value: "" } };
export const WithHelp: Story = {
  args: { disabled: true, help: "Locked once the game has started." },
};
export const WithError: Story = { args: { error: "Pick today or a later day." } };
