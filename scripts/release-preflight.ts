import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

type CheckLevel = "PASS" | "WARN" | "FAIL";

function report(level: CheckLevel, label: string, detail: string) {
  const marker = level === "PASS" ? "✓" : level === "WARN" ? "!" : "✗";
  console.log(`${marker} ${level.padEnd(4)} ${label}: ${detail}`);
}

async function loadLocalEnvironment() {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL_UNPOOLED && process.env.AUTH_SECRET && process.env.PASSWORD_PEPPER && process.env.NEXT_PUBLIC_APP_URL) {
    report("PASS", "Environment source", "runtime environment loaded");
    return true;
  }
  const path = resolve(process.cwd(), ".env.local");
  try {
    await access(path);
    process.loadEnvFile(path);
    report("PASS", "Environment file", ".env.local loaded");
  } catch {
    report("FAIL", "Environment file", "Create .env.local from .env.example first");
    process.exitCode = 1;
    return false;
  }
  return true;
}

async function main() {
  console.log("\nPrepNexa release-candidate preflight\n");
  if (!(await loadLocalEnvironment())) return;

  const { envSchema } = await import("../src/config/env");
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      report("FAIL", issue.path.join(".") || "Environment", issue.message);
    }
    process.exitCode = 1;
    return;
  }

  const env = parsed.data;
  report("PASS", "Environment", "required values are valid (secrets not displayed)");
  if (env.RESEND_API_KEY && env.EMAIL_FROM) {
    report("PASS", "Email", `Resend configured with ${env.EMAIL_FROM}`);
  } else {
    report("WARN", "Email", "not configured; real signup/reset email testing will be unavailable");
  }
  report(env.PAYMENT_PROVIDER === "mock" ? "PASS" : "WARN", "Payment", `${env.PAYMENT_PROVIDER} provider selected`);
  report(env.STORAGE_PROVIDER === "local" ? "PASS" : "WARN", "Storage", `${env.STORAGE_PROVIDER} provider selected`);

  try {
    const sql = neon(env.DATABASE_URL);
    const requiredTables = ["attempts", "exams", "orders", "products", "roles", "support_tickets", "tests", "users"];
    const [databaseState] = await sql`
      select
        (select array_agg(key order by key) from roles) as role_keys,
        (
          select count(distinct ur.user_id)::int
          from user_roles ur
          inner join roles r on r.id = ur.role_id
          where r.key = 'ADMIN'
        ) as admin_count,
        (
          select count(*)::int
          from information_schema.tables
          where table_schema = 'public' and table_name = any(${requiredTables})
        ) as critical_table_count
    ` as Array<{ role_keys: string[] | null; admin_count: number; critical_table_count: number }>;
    const roleKeys = databaseState?.role_keys ?? [];
    const expectedRoles = ["ADMIN", "STUDENT"];
    if (JSON.stringify(roleKeys) !== JSON.stringify(expectedRoles)) {
      report("FAIL", "Roles", `expected ADMIN, STUDENT; found ${roleKeys.join(", ") || "none"}`);
      process.exitCode = 1;
    } else {
      report("PASS", "Roles", "exactly ADMIN and STUDENT are seeded");
    }

    if (databaseState?.admin_count !== 1) {
      report("FAIL", "Admin", `expected exactly 1 Admin; found ${databaseState?.admin_count ?? 0}`);
      process.exitCode = 1;
    } else {
      report("PASS", "Admin", "exactly one Admin account is assigned");
    }

    if (databaseState?.critical_table_count !== requiredTables.length) {
      report("FAIL", "Database schema", `expected ${requiredTables.length} critical tables; found ${databaseState?.critical_table_count ?? 0}`);
      process.exitCode = 1;
    } else {
      report("PASS", "Database schema", `${requiredTables.length} critical tables are present`);
    }
  } catch (error) {
    report("FAIL", "Database", error instanceof Error ? error.message : "connection failed");
    process.exitCode = 1;
  }

  console.log(process.exitCode ? "\nPreflight failed. Fix the items above before UAT.\n" : "\nPreflight passed. Start the app with: npm run dev\n");
}

void main();
