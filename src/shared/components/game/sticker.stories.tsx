import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ana, noor } from "./fixtures";
import { Sticker } from "./sticker";
import type { StickerMode, StickerSize } from "./sticker-view";

const MODES: StickerMode[] = ["locked", "collected", "maybe", "ruled"];
const SIZES: StickerSize[] = ["sm", "lg"];

const meta = {
  title: "Game/Cards/Sticker",
  component: Sticker,
  tags: ["autodocs"],
  args: { person: noor, mode: "collected", size: "sm" },
  argTypes: {
    mode: { control: "inline-radio", options: MODES },
    size: { control: "inline-radio", options: SIZES },
    celebratePalette: { control: "inline-radio", options: ["light", "dark", "found"] },
    rot: { control: { type: "range", min: -6, max: 6, step: 1 } },
  },
} satisfies Meta<typeof Sticker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Locked: Story = { args: { mode: "locked" } };
export const Collected: Story = { args: { mode: "collected" } };
export const Maybe: Story = { args: { mode: "maybe" } };
export const Ruled: Story = { args: { mode: "ruled", person: ana } };

export const WithPhoto: Story = { args: { person: ana } };
export const Large: Story = { args: { size: "lg", mode: "collected", person: ana } };
export const HandStuck: Story = { args: { rot: -3, tilt: false } };

export const Gallery: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div className="flex flex-col gap-12">
      {SIZES.flatMap((size) =>
        [noor, ana].map((person) => (
          <div
            key={`${size}-${person.name}`}
            className="flex flex-wrap items-start gap-x-8 gap-y-10"
          >
            {MODES.map((mode) => (
              <Sticker key={mode} {...args} person={person} mode={mode} size={size} />
            ))}
          </div>
        )),
      )}
    </div>
  ),
};
