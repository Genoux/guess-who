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

export const ViewsWithCounts: Story = {
  args: {
    tone: "page",
    label: "People views",
    tabs: [
      { onSelect: () => {}, label: "Playing", count: 6, current: true },
      { onSelect: () => {}, label: "Team", count: 112 },
      { onSelect: () => {}, label: "Done", count: 5 },
    ],
  },
};

export const SixTabs: Story = {
  args: {
    tabs: [
      { href: "#album", label: "Album", current: true },
      { href: "#mission", label: "Mission", badge: "New clue" },
      { href: "#card", label: "My card" },
      { href: "#clues", label: "My clues" },
      { href: "#welcomer", label: "Welcomer" },
      { href: "#people", label: "People" },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Six tabs are the most: on a phone they share the width, and where they cannot the row scrolls sideways with the open tab brought into view. The open tab's background slides to the next one, and hovering it changes nothing.",
      },
    },
  },
};
