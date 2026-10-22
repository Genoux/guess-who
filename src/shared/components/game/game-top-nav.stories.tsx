import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CountChip } from "./count-chip";
import { GameAvatar } from "./game-avatar";
import { GameTopNav } from "./game-top-nav";
import { PillTabs } from "./pill-tabs";

const meta = {
  title: "Game/Navigation/GameTopNav",
  component: GameTopNav,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: {
    logoHref: "#album",
    tabs: (
      <PillTabs
        tabs={[
          { href: "#album", label: "Album", current: true },
          { href: "#mission", label: "Mission", badge: "New clue" },
        ]}
      />
    ),
    end: (
      <>
        <CountChip>5 / 20</CountChip>
        <GameAvatar name="Léa Martin" color="#FF97AB" />
      </>
    ),
  },
} satisfies Meta<typeof GameTopNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithoutTabs: Story = { args: { tabs: undefined } };
export const PlainLogo: Story = { args: { logoHref: undefined } };
export const Mobile: Story = { globals: { viewport: { value: "mobile1", isRotated: false } } };
