import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CircleHelpIcon } from "lucide-react";
import { GameTooltip } from "./game-tooltip";

// The icon button is skipped here: it already wraps its own tooltip, so this shows the bare trigger.
const meta = {
  title: "Game/Feedback/GameTooltip",
  component: GameTooltip,
  tags: ["autodocs"],
  args: {
    label: "How it works",
    side: "bottom",
    children: (
      <button
        type="button"
        aria-label="How it works"
        className="inline-flex size-11 items-center justify-center rounded-full bg-game-sidebar"
      >
        <CircleHelpIcon aria-hidden className="size-4.5" />
      </button>
    ),
  },
  argTypes: { side: { control: "inline-radio", options: ["top", "bottom", "left", "right"] } },
  decorators: [
    (Story) => (
      <div className="px-24 py-16">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GameTooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.hover(canvas.getByRole("button"));
  },
};
