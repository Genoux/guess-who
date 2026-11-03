import { TooltipProvider } from "@inbeat/ui/components/tooltip";
import type { Decorator, Preview } from "@storybook/nextjs-vite";
import { GameMotionConfig } from "../src/shared/components/game/game-motion-config";
import "../src/app/globals.css";
import "../src/shared/components/game/game-fonts.css";

const GAME_BACKGROUNDS = {
  game: { name: "Game", value: "#F7F7F3" },
  ink: { name: "Ink", value: "#191910" },
  found: { name: "Found", value: "#EA4112" },
  creative: { name: "Stage blue", value: "#46BDF0" },
  talent: { name: "Stage pink", value: "#FF97AB" },
};

// The app's root layout mounts the TooltipProvider. GameShell also mounts the toaster and fills the viewport, so stories take only its base look.
const withGameBase: Decorator = (Story) => (
  <div className="font-game-sans text-base text-game-ink">
    <TooltipProvider>
      <GameMotionConfig>
        <Story />
      </GameMotionConfig>
    </TooltipProvider>
  </div>
);

const preview: Preview = {
  decorators: [withGameBase],
  initialGlobals: { backgrounds: { value: "game" } },
  parameters: {
    layout: "centered",
    backgrounds: { options: GAME_BACKGROUNDS },
    a11y: { test: "error" },
    controls: { matchers: { color: /(background|color)$/i } },
    options: {
      storySort: {
        order: [
          "Game",
          ["Cards", "Display", "Controls", "Forms", "Navigation", "Layout", "Feedback", "Motion"],
        ],
      },
    },
  },
};

export default preview;
