import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { moderateReviewSchema, submitReviewSchema } from "@/features/reviews/validation";

describe("verified-purchase review moderation", () => {
  it("validates public reviews and keeps private feedback separate", () => {
    const parsed = submitReviewSchema.parse({ productId: "11111111-1111-4111-8111-111111111111", rating: 5, comment: "The practice sets were useful.", feedback: "Please add more examples." });
    expect(parsed.feedback).toBe("Please add more examples.");
    expect(() => submitReviewSchema.parse({ ...parsed, rating: 6 })).toThrow();
    expect(moderateReviewSchema.parse({ status: "APPROVED" }).status).toBe("APPROVED");
  });

  it("does not require a rejection reason", () => {
    expect(moderateReviewSchema.safeParse({ status: "REJECTED", note: "" }).success).toBe(true);
    expect(moderateReviewSchema.safeParse({ status: "REJECTED", note: "Please remove personal contact details." }).success).toBe(true);
    expect(moderateReviewSchema.safeParse({ status: "APPROVED", note: "" }).success).toBe(true);
  });

  it("publishes only approved reviews and routes submissions through dashboards", () => {
    const catalog = readFileSync("src/features/catalog/repository.ts", "utf8");
    const reviewRepo = readFileSync("src/features/reviews/repository.ts", "utf8");
    const packagePage = readFileSync("src/app/(public)/packages/[slug]/page.tsx", "utf8");
    const studentPage = readFileSync("src/app/(workspace)/dashboard/reviews/page.tsx", "utf8");
    const adminPage = readFileSync("src/app/(workspace)/admin/reviews/page.tsx", "utf8");
    const reviewActions = readFileSync("src/features/reviews/ui/review-actions.tsx", "utf8");
    expect(catalog.match(/status='APPROVED'/g)?.length).toBeGreaterThanOrEqual(3);
    expect(reviewRepo).toContain("o.status='PAID'");
    expect(reviewRepo).toContain("e.status in ('ACTIVE','EXPIRED')");
    expect(reviewRepo).toContain("status='PENDING'");
    expect(reviewRepo).toContain("desc(latestPurchase)");
    expect(reviewRepo).not.toContain("desc(orders.paidAt)");
    expect(reviewRepo).not.toContain("db.transaction(");
    expect(reviewRepo).toContain("with target as (");
    expect(reviewRepo).toContain("for update");
    expect(reviewRepo).toContain("from updated u cross join logged");
    expect(packagePage).not.toContain("ProductReviewForm");
    expect(packagePage).toContain("/dashboard/reviews");
    expect(packagePage).not.toContain("Reviews appear here after moderation");
    expect(studentPage).not.toContain("Public reviews are checked");
    expect(studentPage).not.toContain("reviewStatus");
    expect(studentPage).not.toContain("moderationNote");
    expect(adminPage).toContain('APPROVED:"Published"');
    expect(adminPage).toContain('REJECTED:"Hidden"');
    expect(reviewActions).toContain('currentStatus!=="APPROVED"');
    expect(reviewActions).toContain('currentStatus!=="REJECTED"');
    expect(reviewActions).toContain("Visible on the package page");
    expect(reviewActions).not.toContain("shown to learner");
    expect(reviewActions).not.toContain("Moderator note");
  });
});
