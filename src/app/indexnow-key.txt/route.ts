import { env } from "@/config/env";

export function GET() {
  if (!env.INDEXNOW_KEY) return new Response("Not found", { status: 404 });
  return new Response(env.INDEXNOW_KEY, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
