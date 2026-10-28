import { env } from "@/config/env";
import { AppError } from "@/lib/errors/app-error";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function isSignedWebhook(url: URL) {
  return url.pathname.startsWith("/api/commerce/webhooks/");
}

export function enforceSameOriginRequest(request: Request) {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return;
  const requestUrl = new URL(request.url);
  if (isSignedWebhook(requestUrl)) return;

  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (fetchSite === "cross-site" || fetchSite === "same-site") {
    throw new AppError("CROSS_SITE_REQUEST_BLOCKED", "This request was blocked for your security.", 403);
  }

  const origin = request.headers.get("origin");
  const canonicalOrigin = new URL(env.NEXT_PUBLIC_APP_URL).origin;
  const allowedOrigins = env.NODE_ENV === "production"
    ? new Set([canonicalOrigin])
    : new Set([canonicalOrigin, requestUrl.origin]);

  if (origin && allowedOrigins.has(origin)) return;
  if (!origin && fetchSite === "same-origin") return;

  throw new AppError("CROSS_SITE_REQUEST_BLOCKED", "This request was blocked for your security.", 403);
}
