import { neon } from "@neondatabase/serverless";
import { drizzle as createNeonDatabase } from "drizzle-orm/neon-http";
import { drizzle as createNodePostgresDatabase } from "drizzle-orm/node-postgres";
import { env } from "@/config/env";
import * as schema from "./schema";

const neonDatabase = createNeonDatabase(neon(env.DATABASE_URL), { schema });
type AppDatabase = typeof neonDatabase;

function isLocalTestDatabase() {
  if (env.NODE_ENV !== "test") return false;
  const host = new URL(env.DATABASE_URL).hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function createLocalTestDatabase(): AppDatabase {
  const database = createNodePostgresDatabase(env.DATABASE_URL, { schema });
  const compatible = database as unknown as AppDatabase;

  // Neon HTTP exposes an efficient batch API that the repositories use in
  // production. node-postgres does not expose that helper, so the disposable
  // CI database executes the already-built Drizzle queries in their declared
  // order. Preserving order is required for foreign-key-dependent batches.
  compatible.batch = async (queries) => {
    const results: unknown[] = [];
    for (const query of queries) results.push(await query);
    return results as ReturnType<AppDatabase["batch"]>;
  };

  return compatible;
}

export const db: AppDatabase = isLocalTestDatabase()
  ? createLocalTestDatabase()
  : neonDatabase;
