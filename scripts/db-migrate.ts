// `drizzle-kit migrate`, refusing the production branch unless ALLOW_PROD_MIGRATIONS=1.
import { spawnSync } from "node:child_process";
import { loadEnvConfig } from "@next/env";
import { assertNotProduction } from "../src/db/assert-not-production";

loadEnvConfig(process.cwd(), true);
assertNotProduction(process.env.DATABASE_URL, {
  allowProduction: process.env.ALLOW_PROD_MIGRATIONS === "1",
});

const { status } = spawnSync("drizzle-kit", ["migrate"], { stdio: "inherit" });
process.exit(status ?? 1);
