import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { apiRateLimits } from "@/db/schema";
import { AppError } from "@/lib/errors/app-error";
import { hashIdentifier } from "./crypto";

type RateLimitInput = {
  action: string;
  identifier: string;
  maximum: number;
  windowSeconds: number;
  message?: string;
};

export async function enforceRateLimit(input: RateLimitInput) {
  const now = Date.now();
  const windowMs = input.windowSeconds * 1000;
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  const expiresAt = new Date(windowStart.getTime() + windowMs * 2);
  const keyHash = hashIdentifier(`${input.action}:${input.identifier}`);

  const result = await db.execute<{ request_count: number }>(sql`
    insert into ${apiRateLimits} (action, key_hash, window_start, request_count, expires_at)
    values (${input.action}, ${keyHash}, ${windowStart}, 1, ${expiresAt})
    on conflict (action, key_hash, window_start) do update
      set request_count = ${apiRateLimits.requestCount} + 1,
          expires_at = excluded.expires_at
      where ${apiRateLimits.requestCount} < ${input.maximum}
    returning request_count
  `);

  if (!result.rows[0]) {
    throw new AppError(
      "RATE_LIMITED",
      input.message ?? "Too many requests. Please wait and try again.",
      429,
    );
  }

  // Keep this operational table bounded without adding a separate cron job.
  if (Math.random() < 0.01) {
    void db.delete(apiRateLimits).where(sql`${apiRateLimits.expiresAt} < now()`).catch(() => undefined);
  }
}
