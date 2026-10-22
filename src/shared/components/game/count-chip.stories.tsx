import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CountChip } from "./count-chip";
import { jonah } from "./fixtures";

const VARIANTS = ["default", "yellow", "dark"] as const;
const SIZES = ["default", "sm"] as const;

const meta = {
  title: "Game/Display/CountChip",
  component: CountChip,
  tags: ["autodocs"],
  args: { children: "5 / 20", variant: "default", size: "default" },
  argTypes: {
    variant: { control: "inline-radio", options: VARIANTS },
    size: { control: "inline-radio", options: SIZES },
    dotColor: { control: "color" },
  },
} satisfies Meta<typeof CountChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Yellow: Story = { args: { variant: "yellow", children: "No. 21 · Talent" } };
export const Dark: Story = { args: { variant: "dark", children: "8 days left" } };
export const Small: Story = { args: { size: "sm" } };
export const WithTeamDot: Story = { args: { dotColor: jonah.color, children: jonah.name } };

export const Gallery: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div className="flex flex-col gap-4">
      {SIZES.map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-4">
          {VARIANTS.map((variant) => (
            <CountChip key={variant} {...args} variant={variant} size={size} dotColor={jonah.color}>
              {variant}
            </CountChip>
          ))}
        </div>
      ))}
    </div>
  ),
};
