import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRightIcon } from "lucide-react";
import { GameButton } from "./game-button";

const VARIANTS = ["cta", "yellow", "light", "on-dark", "link"] as const;
const SIZES = ["default", "sm"] as const;

const meta = {
  title: "Game/Controls/GameButton",
  component: GameButton,
  tags: ["autodocs"],
  args: { children: "Write my clues", variant: "cta", size: "default" },
  argTypes: {
    variant: { control: "inline-radio", options: VARIANTS },
    size: { control: "inline-radio", options: SIZES },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof GameButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Cta: Story = { args: { variant: "cta" } };
export const Yellow: Story = { args: { variant: "yellow" } };
export const Light: Story = { args: { variant: "light" } };
export const OnDark: Story = {
  args: { variant: "on-dark" },
  globals: { backgrounds: { value: "ink" } },
};
export const Link: Story = { args: { variant: "link", children: "Not sure yet" } };
export const Small: Story = { args: { size: "sm" } };
export const Disabled: Story = { args: { disabled: true } };
export const WithIcon: Story = {
  args: {
    children: (
      <>
        Start the game
        <ArrowRightIcon aria-hidden className="size-4.5" />
      </>
    ),
  },
};
export const AsLink: Story = {
  args: {
    asChild: true,
    children: <a href="#welcome">Back to the album</a>,
  },
};

export const Gallery: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div className="flex flex-col gap-6">
      {SIZES.map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-4">
          {VARIANTS.map((variant) => (
            <div
              key={variant}
              className={variant === "on-dark" ? "rounded-full bg-game-ink p-3" : "p-3"}
            >
              <GameButton {...args} variant={variant} size={size}>
                {variant}
              </GameButton>
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
};
