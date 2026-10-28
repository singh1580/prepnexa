import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("database test adapter", () => {
  const client = readFileSync("src/db/client.ts", "utf8");

  it("uses node-postgres only for local test databases", () => {
    expect(client).toContain('env.NODE_ENV !== "test"');
    expect(client).toContain('host === "localhost"');
    expect(client).toContain("createNodePostgresDatabase");
    expect(client).toContain(": neonDatabase");
  });
});
