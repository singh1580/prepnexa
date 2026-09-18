export type ApiSuccess<T> = { data: T; meta: { requestId: string } };
export type ApiFailure = { error: { code: string; message: string; details?: unknown }; meta: { requestId: string } };

export function successResponse<T>(data: T, requestId: string, init?: ResponseInit) {
  const body: ApiSuccess<T> = { data, meta: { requestId } };
  return Response.json(body, { ...init, headers: withRequestId(init?.headers, requestId) });
}

export function errorResponse(code: string, message: string, status: number, requestId: string, details?: unknown) {
  const error = details === undefined ? { code, message } : { code, message, details };
  const body: ApiFailure = { error, meta: { requestId } };
  return Response.json(body, { status, headers: withRequestId(undefined, requestId) });
}

function withRequestId(headers: HeadersInit | undefined, requestId: string) {
  const result = new Headers(headers);
  result.set("x-request-id", requestId);
  result.set("cache-control", "no-store");
  return result;
}
