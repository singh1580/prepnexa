import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const migrationUrl = process.env.DATABASE_URL_UNPOOLED;
if (!migrationUrl?.startsWith("postgresql://")) {
  throw new Error(
    "DATABASE_URL_UNPOOLED is missing or invalid. Add the direct Neon connection string to .env.local before running migrations.",
  );
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: migrationUrl },
  strict: true,
  verbose: true,
});
