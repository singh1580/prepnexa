import type { ApiFailure, ApiSuccess } from "@/lib/http/api-response";

export class AdminContentApiError extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}

export async function adminContentRequest<T>(path: string, method: "POST" | "PATCH", body: Record<string, unknown>) {
  const response = await fetch(`/api/admin/content/${path}`, {
    method, credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const payload = await response.json() as ApiSuccess<T> | ApiFailure;
  if (!response.ok || "error" in payload) {
    const error = "error" in payload ? payload.error : { code: "REQUEST_FAILED", message: "Couldn't complete this request." };
    throw new AdminContentApiError(error.code, error.message);
  }
  return payload.data;
}
