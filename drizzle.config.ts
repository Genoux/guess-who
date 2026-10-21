import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd());

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  // `generate` and `check` never connect, so CI runs them without a database URL.
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
