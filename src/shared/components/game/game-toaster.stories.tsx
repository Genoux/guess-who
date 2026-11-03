import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GameButton } from "./game-button";
import { GameToaster, gameToast } from "./game-toaster";

const meta = {
  title: "Game/Feedback/GameToaster",
  component: GameToaster,
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="flex min-h-64 items-center justify-center">
      <GameToaster />
      <GameButton size="sm" onClick={() => gameToast("+1 sticker")}>
        Show a toast
      </GameButton>
    </div>
  ),
} satisfies Meta<typeof GameToaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Show a toast" }));
  },
};
