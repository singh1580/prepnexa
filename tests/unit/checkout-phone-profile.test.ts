import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const service = readFileSync(
  new URL("../../src/features/commerce/service.ts", import.meta.url),
  "utf8",
).replace(/\s+/g, "");
const repository = readFileSync(
  new URL("../../src/features/commerce/repository.ts", import.meta.url),
  "utf8",
).replace(/\s+/g, "");
const migration = readFileSync(
  new URL("../../drizzle/0035_backfill_checkout_profile_phones.sql", import.meta.url),
  "utf8",
).replace(/\s+/g, " ");

describe("checkout phone persistence", () => {
  it("falls back to the authenticated profile phone for later purchases", () => {
    expect(service).toContain('input.phone??normalizeIndianMobile(student.phone??"")');
    expect(service).toContain('normalizeIndianMobile(existing.billingPhone??"")');
  });

  it("saves a checkout phone only when the profile does not already have one", () => {
    expect(service).toContain("saveCheckoutPhoneToEmptyProfile(student.userId,billingPhone)");
    expect(repository).toContain("and(eq(users.id,userId),isNull(users.phone))");
  });

  it("backfills only empty profiles from a valid latest paid-order phone", () => {
    expect(migration).toContain('"status" = \'PAID\'');
    expect(migration).toContain('ORDER BY "user_id", "paid_at" DESC NULLS LAST');
    expect(migration).toContain("nullif(trim(u.\"phone\"), '') IS NULL");
    expect(migration).toContain("'^\\+91[6-9][0-9]{9}$'");
  });
});
