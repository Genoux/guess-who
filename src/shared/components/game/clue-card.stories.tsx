import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ClueCard, type ClueCardState } from "./clue-card";
import { welcomerClue } from "./fixtures";

const STATES: ClueCardState[] = ["locked", "down", "up"];
const SIZES = ["sm", "lg"] as const;

const meta = {
  title: "Game/Cards/ClueCard",
  component: ClueCard,
  tags: ["autodocs"],
  args: { state: "up", size: "sm", label: "Clue 2", text: welcomerClue },
  argTypes: {
    state: { control: "inline-radio", options: STATES },
    size: { control: "inline-radio", options: SIZES },
    rot: { control: { type: "range", min: -6, max: 6, step: 1 } },
  },
} satisfies Meta<typeof ClueCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Locked: Story = {
  args: { state: "locked", label: "Clue 3", footer: "Unlocks in 3 days" },
};
export const FaceDown: Story = { args: { state: "down", label: "Clue 3", footer: "In 3 days" } };
export const FaceUp: Story = { args: { state: "up", footer: "From your welcomer" } };
export const Large: Story = { args: { state: "up", size: "lg", footer: "From your welcomer" } };
export const HandPlaced: Story = { args: { rot: 3 } };

export const Gallery: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div className="flex flex-col gap-10">
      {SIZES.map((size) => (
        <div key={size} className="flex flex-wrap items-start gap-8">
          {STATES.map((state) => (
            <ClueCard
              key={state}
              {...args}
              state={state}
              size={size}
              footer={
                state === "locked"
                  ? "Unlocks in 3 days"
                  : state === "up"
                    ? "From your welcomer"
                    : undefined
              }
            />
          ))}
        </div>
      ))}
    </div>
  ),
};
