import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GameModalActions } from "./game-modal-actions";

const meta = {
  title: "Game/Controls/GameModalActions",
  component: GameModalActions,
  tags: ["autodocs"],
  args: {
    secondary: { label: "Cancel" },
    primary: { label: "OK" },
  },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GameModalActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Save: Story = {
  args: { secondary: { label: "Cancel" }, primary: { label: "Save", type: "submit" } },
};
export const Pending: Story = { args: { primary: { label: "OK", disabled: true } } };
