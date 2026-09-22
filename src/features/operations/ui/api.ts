export class OperationsApiError extends Error {
  constructor(public code: string, message: string, public requestId?: string) { super(message); }
}

export async function operationsRequest<T>(path: string, body?: unknown, method = "POST"): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/operations/${path}`, { method, credentials: "same-origin", headers: body === undefined ? undefined : { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch { throw new OperationsApiError("NETWORK_ERROR", "Couldn't connect. Check your connection and try again."); }
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new OperationsApiError(result?.error?.code ?? "REQUEST_FAILED", result?.error?.message ?? "Couldn't complete this request.", result?.meta?.requestId);
  return result.data as T;
}
