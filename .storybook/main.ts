import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  framework: "@storybook/nextjs-vite",
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  // The licensed fonts live in public/fonts (git-ignored); the font stacks fall back without them.
  staticDirs: ["../public"],
  core: { disableTelemetry: true },
};

export default config;
