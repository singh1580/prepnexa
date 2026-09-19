import { expect, it, vi } from "vitest";
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
import { logger } from "@/lib/logger";
import { executeRoute } from "@/lib/http/route-handler";
it("does not log query parameters or secret-bearing database errors", async () => {
  const failure = Object.assign(new Error("private answer"), { query: "insert secret", params: ["private-token"] });
  const response = await executeRoute(new Request("http://localhost/api/test"), async () => { throw failure; });
  expect(response.status).toBe(500);
  const logged = JSON.stringify(vi.mocked(logger.error).mock.calls);
  expect(logged).not.toContain("private-token");
  expect(logged).not.toContain("private answer");
  expect(logged).not.toContain("insert secret");
});
