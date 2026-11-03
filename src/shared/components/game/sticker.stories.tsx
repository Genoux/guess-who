import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ana, longest, noor, unbroken } from "./fixtures";
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
    backdrop: { control: "inline-radio", options: ["light", "dark", "found"] },
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
export const AlbumWithPhoto: Story = { args: { person: ana, size: "sm", mode: "collected" } };
export const AlbumExpanded: Story = {
  args: { person: ana, size: "sm", mode: "collected", expanded: true, askToggle: true },
  decorators: [
    (Story) => (
      <div className="@container w-100">
        <div className="zoom-open">
          <Story />
        </div>
      </div>
    ),
  ],
};
export const AlbumExpandedLongest: Story = {
  args: { person: longest, size: "sm", mode: "collected", expanded: true, askToggle: true },
  decorators: AlbumExpanded.decorators,
};
export const AlbumLongest: Story = {
  args: { person: { ...longest, photoUrl: ana.photoUrl }, size: "sm", mode: "collected" },
};
export const Large: Story = { args: { size: "lg", mode: "collected", person: ana } };
export const LargeAskOpen: Story = {
  args: { size: "lg", mode: "collected", person: ana, askToggle: true, askRevealed: true },
};
export const LargeNoPhoto: Story = { args: { size: "lg", mode: "collected", person: noor } };
export const LongestTextLargeAskOpen: Story = {
  args: { person: longest, mode: "collected", size: "lg", askToggle: true, askRevealed: true },
};
export const UnbrokenTextLargeAskOpen: Story = {
  args: { person: unbroken, mode: "collected", size: "lg", askToggle: true, askRevealed: true },
};
export const LongestTextSmall: Story = { args: { person: longest, mode: "locked" } };
export const LongestTextLarge: Story = { args: { person: longest, mode: "collected", size: "lg" } };
export const LongestAskLockedLarge: Story = {
  args: { person: longest, mode: "locked", size: "lg" },
};
export const UnbrokenTextSmall: Story = { args: { person: unbroken, mode: "locked" } };
export const UnbrokenTextLarge: Story = {
  args: { person: unbroken, mode: "collected", size: "lg" },
};
export const UnbrokenAskLockedLarge: Story = {
  args: { person: unbroken, mode: "locked", size: "lg" },
};
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
