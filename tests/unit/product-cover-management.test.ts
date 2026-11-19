import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("product cover management", () => {
  const service = readFileSync(
    "src/features/admin-catalog/service.ts",
    "utf8",
  );
  const repository = readFileSync(
    "src/features/admin-catalog/repository.ts",
    "utf8",
  );
  const route = readFileSync(
    "src/app/api/admin/catalog/products/[id]/cover/route.ts",
    "utf8",
  );

  it("supports an audited cover removal without leaving a live package coverless", () => {
    expect(route).toContain("export async function DELETE");
    expect(route).toContain("removeProductCover");
    expect(service).toContain("if (product.isLive)");
    expect(service).toContain(
      "Make this package offline before removing its current cover.",
    );
    expect(repository).toContain("coverObjectKey: null");
    expect(repository).toContain('action: "product.cover_removed"');
  });
});
