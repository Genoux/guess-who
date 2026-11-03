import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ana, jonah, noor } from "./fixtures";
import { GameBook } from "./game-book";
import { Sticker } from "./sticker";

const meta = {
  title: "Game/Layout/GameBook",
  component: GameBook,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    children: (
      <div className="flex flex-wrap justify-center gap-6">
        <Sticker person={noor} />
        <Sticker person={jonah} mode="locked" />
        <Sticker person={ana} mode="maybe" />
      </div>
    ),
  },
} satisfies Meta<typeof GameBook>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Album: Story = {};
export const AsDiv: Story = { args: { as: "div" } };
