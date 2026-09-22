import { describe, expect, it } from "vitest";
import { materialInputSchema, productInputSchema, productCreateSchema } from "../../src/features/admin-catalog/validation";

describe("admin catalog validation", () => {
  it("validates package price, access and slug", () => {
    expect(productInputSchema.safeParse({ name: "Complete Prep", slug: "complete-prep", description: "", pricePaise: 99900, accessDays: 365 }).success).toBe(true);
    expect(productInputSchema.safeParse({ name: "Complete Prep", slug: "../prep", description: "", pricePaise: -1, accessDays: 0 }).success).toBe(false);
  });
  it("accepts independent standalone and mixed bundles without duplicate selections", () => {
    const base = { name: "Quant pack", slug: "quant-pack", pricePaise: 19900, accessDays: 90 };
    const id = crypto.randomUUID();
    expect(productCreateSchema.safeParse({ ...base, testIds: [id], materialIds: [crypto.randomUUID()] }).success).toBe(true);
    expect(productCreateSchema.safeParse({ ...base, materialIds: [id] }).success).toBe(true);
    expect(productCreateSchema.safeParse({ ...base, testIds: [id, id] }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...base, testIds: [id] }).success).toBe(false);
  });
  it("requires content or storage metadata by material type", () => {
    const base = { examId: crypto.randomUUID(), title: "Study guide", body: "", privateObjectKey: "" };
    expect(materialInputSchema.safeParse({ ...base, type: "ARTICLE", body: "Useful article" }).success).toBe(true);
    expect(materialInputSchema.safeParse({ ...base, type: "ARTICLE" }).success).toBe(false);
    expect(materialInputSchema.safeParse({ ...base, type: "PDF", privateObjectKey: "future/private/guide.pdf" }).success).toBe(true);
  });
});
