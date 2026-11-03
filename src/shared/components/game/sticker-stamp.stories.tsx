import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StickerStampMark } from "./sticker-stamp";
import type { StickerSize, StickerStamp } from "./sticker-view";

const STAMPS: StickerStamp[] = ["maybe", "ruled"];
const SIZES: StickerSize[] = ["sm", "lg"];
const CARD_BOX: Record<StickerSize, string> = { sm: "h-62 w-44", lg: "h-106 w-75" };

const meta = {
  title: "Game/Cards/StickerStamp",
  component: StickerStampMark,
  tags: ["autodocs"],
  args: { stamp: "maybe", size: "sm" },
  argTypes: {
    stamp: { control: "inline-radio", options: STAMPS },
    size: { control: "inline-radio", options: SIZES },
  },
  // The stamp positions itself against the sticker, so it needs a card-sized box to land on.
  render: (args) => (
    <div
      className={`relative rounded-card border border-game-border bg-game-surface ${CARD_BOX[args.size]}`}
    >
      <StickerStampMark {...args} />
    </div>
  ),
} satisfies Meta<typeof StickerStampMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Maybe: Story = { args: { stamp: "maybe" } };
export const Ruled: Story = { args: { stamp: "ruled" } };
export const Large: Story = { args: { stamp: "maybe", size: "lg" } };

export const Gallery: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-col gap-10">
      {SIZES.map((size) => (
        <div key={size} className="flex flex-wrap gap-8">
          {STAMPS.map((stamp) => (
            <div
              key={stamp}
              className={`relative rounded-card border border-game-border bg-game-surface ${CARD_BOX[size]}`}
            >
              <StickerStampMark stamp={stamp} size={size} />
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
};
