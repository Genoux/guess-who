import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Stepper } from "./stepper";

const meta = {
  title: "Game/Display/Stepper",
  component: Stepper,
  tags: ["autodocs"],
  args: { count: 4, current: 2, tone: "light", cumulative: false },
  argTypes: {
    tone: { control: "inline-radio", options: ["light", "dark"] },
    count: { control: { type: "range", min: 2, max: 8, step: 1 } },
    current: { control: { type: "range", min: 1, max: 8, step: 1 } },
  },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Step: Story = { args: { cumulative: false } };
export const Progress: Story = { args: { cumulative: true, current: 3 } };
export const OnInk: Story = { args: { tone: "dark" }, globals: { backgrounds: { value: "ink" } } };

export const Gallery: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div className="flex flex-col gap-6">
      {([false, true] as const).map((cumulative) => (
        <div key={String(cumulative)} className="flex flex-col gap-4">
          <Stepper {...args} tone="light" cumulative={cumulative} />
          <div className="rounded-game-md bg-game-ink p-4">
            <Stepper {...args} tone="dark" cumulative={cumulative} />
          </div>
        </div>
      ))}
    </div>
  ),
};
