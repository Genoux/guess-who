import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GameBook } from "./game-book";
import { PageTransition } from "./page-transition";

// PageTransition plays on mount: use the "Remount component" toolbar button to see it again.
const meta = {
  title: "Game/Motion/PageTransition",
  component: PageTransition,
  tags: ["autodocs"],
  args: {
    children: (
      <GameBook>
        <h2 className="font-game-serif text-hero-md">Your album</h2>
      </GameBook>
    ),
  },
} satisfies Meta<typeof PageTransition>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
