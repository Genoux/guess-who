import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PillTabs } from "./pill-tabs";

const meta = {
  title: "Game/Navigation/PillTabs",
  component: PillTabs,
  tags: ["autodocs"],
  args: {
    tabs: [
      { href: "#album", label: "Album", current: true },
      { href: "#mission", label: "Mission" },
    ],
  },
} satisfies Meta<typeof PillTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MissionOpen: Story = {
  args: {
    tabs: [
      { href: "#album", label: "Album" },
      { href: "#mission", label: "Mission", current: true },
    ],
  },
};

export const NewClueBadge: Story = {
  args: {
    tabs: [
      { href: "#album", label: "Album", current: true },
      { href: "#mission", label: "Mission", badge: "New clue" },
    ],
  },
};

export const SingleTab: Story = {
  args: { tabs: [{ href: "#album", label: "Album", current: true }] },
};
