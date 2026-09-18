import { defineConfig } from "drizzle-kit";
import { env } from "./src/config/env";
export default defineConfig({ schema: "./src/db/schema/index.ts", out: "./drizzle", dialect: "postgresql", dbCredentials: { url: env.DATABASE_URL_UNPOOLED }, strict: true, verbose: true });
