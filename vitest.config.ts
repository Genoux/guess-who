import { fileURLToPath } from "node:url";
import { vitestPreset } from "@inbeat/config/vitest";
import { defineConfig } from "vitest/config";

export default defineConfig({
  ...vitestPreset,
  resolve: {
    tsconfigPaths: true,
    alias: {
      // `server-only` throws outside the react-server condition, which vitest does not set.
      "server-only": fileURLToPath(new URL("./src/test/server-only.ts", import.meta.url)),
    },
  },
});
