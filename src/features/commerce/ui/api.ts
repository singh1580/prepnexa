export class CommerceApiError extends Error {
  constructor(public code: string, message: string, public requestId?: string) { super(message); }
}

export async function commerceRequest<T>(path: string, body?: unknown, method = "POST"): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/${path}`, { method, credentials: "same-origin", headers: body === undefined ? undefined : { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch { throw new CommerceApiError("NETWORK_ERROR", "Couldn't connect. Check your connection and try again."); }
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new CommerceApiError(result?.error?.code ?? "REQUEST_FAILED", result?.error?.message ?? "Couldn't complete this request.", result?.meta?.requestId);
  return result.data as T;
}
