export class ClientApiError extends Error {
  constructor(public code: string, message: string, public requestId?: string) { super(message); }
}

export async function authRequest<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/auth/${path}`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch { throw new ClientApiError("NETWORK_ERROR", "Couldn't connect. Check your connection and try again."); }
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new ClientApiError(result?.error?.code ?? "REQUEST_FAILED", result?.error?.message ?? "Couldn't complete this request. Please try again.", result?.meta?.requestId);
  return result.data as T;
}
