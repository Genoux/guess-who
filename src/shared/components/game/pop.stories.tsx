import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { noor } from "./fixtures";
import { Pop } from "./pop";
import { Sticker } from "./sticker";

// Pop plays on mount: use the "Remount component" toolbar button to see it again.
const meta = {
  title: "Game/Motion/Pop",
  component: Pop,
  tags: ["autodocs"],
  args: {
    onShown: fn(),
    children: <Sticker person={noor} />,
  },
} satisfies Meta<typeof Pop>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Staggered: Story = { args: { delay: 0.6 } };
