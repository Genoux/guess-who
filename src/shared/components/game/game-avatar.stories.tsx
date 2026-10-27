import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ana, jonah, noor } from "./fixtures";
import { GameAvatar } from "./game-avatar";

const meta = {
  title: "Game/Display/GameAvatar",
  component: GameAvatar,
  tags: ["autodocs"],
  args: { name: noor.name, color: noor.color },
  argTypes: { color: { control: "color" } },
} satisfies Meta<typeof GameAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const TeamColors: Story = {
  render: () => (
    <div className="flex gap-4">
      {[noor, jonah, ana].map((person) => (
        <GameAvatar key={person.name} name={person.name} color={person.color} />
      ))}
    </div>
  ),
};
