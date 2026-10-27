import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GameButton } from "./game-button";
import { GameStage } from "./game-stage";

const meta = {
  title: "Game/Layout/GameStage",
  component: GameStage,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: {
    children: (
      <>
        <h1 className="font-game-serif text-hero-md">Who is your welcomer?</h1>
        <GameButton>Start guessing</GameButton>
      </>
    ),
  },
  // The stage fills a flex column, as it does under GameShell.
  decorators: [
    (Story) => (
      <div className="flex min-h-120 flex-col">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GameStage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const AsDiv: Story = { args: { as: "div" } };
