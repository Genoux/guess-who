import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { noor } from "./fixtures";
import { DURATION } from "./game-motion";
import { Reveal } from "./reveal";
import { Sticker } from "./sticker";

// Reveal plays on mount: use the "Remount component" toolbar button to see it again.
const meta = {
  title: "Game/Motion/Reveal",
  component: Reveal,
  tags: ["autodocs"],
  args: {
    onShown: fn(),
    children: <p className="font-game-serif text-hero-md">Noor’s in.</p>,
  },
} satisfies Meta<typeof Reveal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rise: Story = {};
export const Fade: Story = { args: { variant: "fade" } };
export const Land: Story = {
  args: { variant: "land", children: <Sticker person={noor} size="lg" /> },
};
export const Delayed: Story = { args: { delay: DURATION.slower } };
