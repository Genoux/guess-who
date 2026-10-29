import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TEAMS } from "./fixtures";
import { GameField, type GameFieldProps } from "./game-field";

const meta = {
  title: "Game/Forms/GameField",
  component: GameField,
  tags: ["autodocs"],
  args: { label: "Your name", placeholder: "Noor Haddad" },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<GameFieldProps>;

export default meta;
// StoryObj<typeof meta> collapses to never on a union of props, so type the stories by args.
type Story = StoryObj<GameFieldProps>;

export const Input: Story = {};
export const WithHelp: Story = { args: { help: "Only you see this." } };
export const WithError: Story = { args: { error: "Add your name to continue." } };
export const Disabled: Story = { args: { disabled: true, defaultValue: "Noor Haddad" } };
export const ReadOnly: Story = { args: { readOnly: true, defaultValue: "noor@inbeat.agency" } };

export const Textarea: Story = {
  args: {
    multiline: true,
    label: "One thing you learned",
    placeholder: "Once won a pie-eating contest by accident.",
    help: "Only you see this.",
  },
};

export const Select: Story = {
  args: {
    label: "Team",
    placeholder: "Pick your team",
    defaultValue: "",
    options: [
      { value: "creative", label: "Creative", color: TEAMS.Creative.color },
      { value: "strategy", label: "Strategy", color: TEAMS.Strategy.color },
      { value: "talent", label: "Talent", color: TEAMS.Talent.color },
    ],
  },
};
