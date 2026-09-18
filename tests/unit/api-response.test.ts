import { describe, expect, it } from "vitest";
import { errorResponse, successResponse } from "../../src/lib/http/api-response";

describe("API response contract", () => {
  it("includes the request ID in a success body and header", async () => {
    const response = successResponse({ ok: true }, "request-1");
    expect(response.headers.get("x-request-id")).toBe("request-1");
    expect(await response.json()).toEqual({ data: { ok: true }, meta: { requestId: "request-1" } });
  });

  it("does not require unsafe details in an error response", async () => {
    const response = errorResponse("NOT_FOUND", "Resource not found.", 404, "request-2");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: { code: "NOT_FOUND", message: "Resource not found." }, meta: { requestId: "request-2" } });
  });
});
