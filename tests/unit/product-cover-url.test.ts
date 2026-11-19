import { describe, expect, it } from "vitest";
import { productCoverUrl } from "../../src/features/catalog/cover";

describe("product cover URLs", () => {
  it("changes the browser cache key whenever a new stored cover is uploaded", () => {
    expect(
      productCoverUrl(
        "product-1",
        "product-covers/product-1/first-cover.png",
      ),
    ).toBe("/media/product-covers/product-1?v=first-cover.png");
    expect(
      productCoverUrl(
        "product-1",
        "product-covers/product-1/replacement-cover.webp",
      ),
    ).toBe("/media/product-covers/product-1?v=replacement-cover.webp");
  });

  it("keeps a valid unversioned route when no stored key is available", () => {
    expect(productCoverUrl("product-1", null)).toBe(
      "/media/product-covers/product-1",
    );
  });
});
