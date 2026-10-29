import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

type CheckLevel = "PASS" | "WARN" | "FAIL";
type MigrationJournal = {
  entries?: Array<{ idx?: number; tag?: string; when?: number }>;
};

function report(level: CheckLevel, label: string, detail: string) {
  const marker = level === "PASS" ? "✓" : level === "WARN" ? "!" : "✗";
  console.log(`${marker} ${level.padEnd(4)} ${label}: ${detail}`);
}

async function loadLocalEnvironment() {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL_UNPOOLED && process.env.AUTH_SECRET && process.env.PASSWORD_PEPPER && process.env.NEXT_PUBLIC_APP_URL) {
    report("PASS", "Environment source", "runtime environment loaded");
    return true;
  }
  const candidates = process.env.NODE_ENV === "production"
    ? [".env.production", ".env.local", ".env"]
    : [".env.local", ".env"];
  for (const name of candidates) {
    const path = resolve(process.cwd(), name);
    try {
      await access(path);
      process.loadEnvFile(path);
      report("PASS", "Environment file", `${name} loaded`);
      return true;
    } catch {
      // Try the next supported environment file.
    }
  }
  report("FAIL", "Environment file", `Create ${candidates[0]} from .env.example first`);
  process.exitCode = 1;
  return false;
}

async function latestRepositoryMigration() {
  const journalPath = resolve(process.cwd(), "drizzle/meta/_journal.json");
  const journal = JSON.parse(await readFile(journalPath, "utf8")) as MigrationJournal;
  const latest = journal.entries?.at(-1);
  if (!latest?.tag || !Number.isSafeInteger(latest.when)) {
    throw new Error("Drizzle migration journal has no valid latest migration");
  }
  return { tag: latest.tag, createdAt: String(latest.when) };
}

async function main() {
  console.log("\nPrepstore release-candidate preflight\n");
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
  if (env.PAYMENT_PROVIDER === "razorpay") {
    report("PASS", "Payment", `Razorpay configured with ${env.RAZORPAY_KEY_ID?.startsWith("rzp_test_") ? "test" : "live"} credentials`);
    report(env.RAZORPAY_WEBHOOK_SECRET ? "PASS" : "WARN", "Payment webhook", env.RAZORPAY_WEBHOOK_SECRET ? "Razorpay webhook verification configured" : "not configured; checkout confirmation works, but webhook recovery is unavailable");
  } else {
    report(env.NODE_ENV === "production" ? "FAIL" : "PASS", "Payment", "mock provider selected");
    if (env.NODE_ENV === "production") process.exitCode = 1;
  }
  report(env.STORAGE_PROVIDER === "s3" ? "PASS" : env.NODE_ENV === "production" ? "FAIL" : "PASS", "Storage", `${env.STORAGE_PROVIDER} provider selected`);

  try {
    const sql = neon(env.DATABASE_URL);
    const requiredTables = ["api_rate_limits", "attempts", "materials", "orders", "products", "roles", "support_tickets", "tests", "users"];
    const requiredProductSeoColumns = ["category", "exam_name", "seo_description", "seo_title", "target_audience"];
    const expectedMigration = await latestRepositoryMigration();
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
          select count(*)::int from users u
          where not exists (select 1 from user_roles ur where ur.user_id = u.id)
        ) as users_without_roles,
        (
          select count(*)::int from products p where p.is_live = true and (
            (not exists(select 1 from product_tests pt where pt.product_id=p.id)
              and not exists(select 1 from product_materials pm where pm.product_id=p.id))
            or exists(select 1 from product_tests pt where pt.product_id=p.id and (
              not exists(select 1 from test_sections ts where ts.test_id=pt.test_id and ts.is_active=true)
              or exists(select 1 from test_sections ts where ts.test_id=pt.test_id and ts.is_active=true
                and not exists(select 1 from test_questions tq where tq.section_id=ts.id))
            ))
            or exists(select 1 from product_materials pm where pm.product_id=p.id
              and not exists(select 1 from material_versions mv where mv.material_id=pm.material_id))
          )
        ) as incomplete_live_products,
        (
          select count(*)::int from products
          where is_live = true and name ~* '(^|[^a-z])(demo|sample|testing[0-9]*)([^a-z]|$)'
        ) as placeholder_live_products,
        (
          select coalesce(array_agg(name || ' [' || slug || ']' order by name), array[]::text[])
          from products
          where is_live = true and name ~* '(^|[^a-z])(demo|sample|testing[0-9]*)([^a-z]|$)'
        ) as placeholder_live_product_names,
        (
          select count(*)::int from sessions
          where revoked_at is null and expires_at <= now()
        ) as expired_open_sessions,
        (
          select count(*)::int
          from information_schema.tables
          where table_schema = 'public' and table_name = any(${requiredTables})
        ) as critical_table_count,
        (
          select count(*)::int
          from information_schema.columns
          where table_schema = 'public'
            and table_name = 'products'
            and column_name = any(${requiredProductSeoColumns})
        ) as product_seo_column_count,
        (
          select max(created_at)::text from drizzle.__drizzle_migrations
        ) as latest_migration_created_at
    ` as Array<{ role_keys: string[] | null; admin_count: number; users_without_roles: number; incomplete_live_products: number; placeholder_live_products: number; placeholder_live_product_names: string[]; expired_open_sessions: number; critical_table_count: number; product_seo_column_count: number; latest_migration_created_at: string | null }>;
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

    if (databaseState?.users_without_roles) {
      report("FAIL", "User roles", `${databaseState.users_without_roles} users have no assigned role; apply pending data-repair migrations`);
      process.exitCode = 1;
    } else {
      report("PASS", "User roles", "every user has an assigned role");
    }

    if (databaseState?.incomplete_live_products) {
      report("FAIL", "Live packages", `${databaseState.incomplete_live_products} live packages contain incomplete tests or materials`);
      process.exitCode = 1;
    } else {
      report("PASS", "Live packages", "all live packages have consumable content");
    }

    if (databaseState?.placeholder_live_products) {
      report("FAIL", "Production catalogue", `${databaseState.placeholder_live_products} live packages still use demo, sample or testing names: ${databaseState.placeholder_live_product_names.join(", ")}`);
      process.exitCode = 1;
    } else {
      report("PASS", "Production catalogue", "no placeholder package names are live");
    }

    if (databaseState?.expired_open_sessions) {
      report("WARN", "Sessions", `${databaseState.expired_open_sessions} expired session rows await housekeeping; authentication already rejects expired sessions`);
    } else {
      report("PASS", "Sessions", "no expired sessions remain open");
    }

    if (databaseState?.critical_table_count !== requiredTables.length) {
      report("FAIL", "Database schema", `expected ${requiredTables.length} critical tables; found ${databaseState?.critical_table_count ?? 0}`);
      process.exitCode = 1;
    } else {
      report("PASS", "Database schema", `${requiredTables.length} critical tables are present`);
    }

    if (databaseState?.product_seo_column_count !== requiredProductSeoColumns.length) {
      report("FAIL", "Product SEO schema", `expected ${requiredProductSeoColumns.length} launch columns; found ${databaseState?.product_seo_column_count ?? 0}; run pending migrations`);
      process.exitCode = 1;
    } else {
      report("PASS", "Product SEO schema", `${requiredProductSeoColumns.length} launch columns are present`);
    }

    if (databaseState?.latest_migration_created_at !== expectedMigration.createdAt) {
      report("FAIL", "Database migrations", `expected ${expectedMigration.tag}; database ledger is behind or differs; run pending migrations`);
      process.exitCode = 1;
    } else {
      report("PASS", "Database migrations", `${expectedMigration.tag} is applied`);
    }
  } catch (error) {
    report("FAIL", "Database", error instanceof Error ? error.message : "connection failed");
    process.exitCode = 1;
  }

  console.log(process.exitCode ? "\nPreflight failed. Fix the items above before UAT.\n" : "\nPreflight passed. Start the app with: npm run dev\n");
}

void main();
