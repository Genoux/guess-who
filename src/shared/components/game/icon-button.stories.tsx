import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CircleHelpIcon } from "lucide-react";
import { gameCn } from "./game-cn";
import { IconButton } from "./icon-button";

const TONES = ["light", "dark", "on-color", "subtle", "outline"] as const;
const SIZES = ["default", "sm", "xs"] as const;
const TONE_PANEL = { "on-color": "bg-game-found" } as const;

const meta = {
  title: "Game/Controls/IconButton",
  component: IconButton,
  tags: ["autodocs"],
  args: { label: "How it works", icon: <CircleHelpIcon />, tone: "light", size: "default" },
  argTypes: {
    tone: { control: "inline-radio", options: TONES },
    size: { control: "inline-radio", options: SIZES },
    icon: { control: false },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Light: Story = { args: { tone: "light" } };
export const Dark: Story = { args: { tone: "dark" } };
export const OnColor: Story = {
  args: { tone: "on-color" },
  globals: { backgrounds: { value: "found" } },
};
export const Subtle: Story = { args: { tone: "subtle" } };
export const Outline: Story = { args: { tone: "outline" } };
export const Small: Story = { args: { size: "sm" } };
export const ExtraSmall: Story = { args: { size: "xs" } };
export const Disabled: Story = { args: { disabled: true } };

export const Gallery: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div className="flex flex-col gap-4">
      {SIZES.map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-4">
          {TONES.map((tone) => (
            <div
              key={tone}
              className={gameCn("rounded-full p-3", tone === "on-color" && TONE_PANEL[tone])}
            >
              <IconButton {...args} tone={tone} size={size} />
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
};
