import { env } from "@/config/env";
import { absoluteUrl, SITE_ORIGIN } from "@/config/site";
import { logger } from "@/lib/logger";

export async function notifyIndexNow(paths: string[]) {
  if (!env.INDEXNOW_KEY || env.NODE_ENV === "test") return;
  const urlList = [...new Set(paths)].map(absoluteUrl);
  try {
    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: new URL(SITE_ORIGIN).host,
        key: env.INDEXNOW_KEY,
        keyLocation: absoluteUrl("/indexnow-key.txt"),
        urlList,
      }),
    });
    if (!response.ok) throw new Error(`IndexNow returned ${response.status}`);
  } catch (error) {
    logger.warn({ error, urlList }, "IndexNow notification failed");
  }
}
