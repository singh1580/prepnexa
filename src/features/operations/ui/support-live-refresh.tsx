"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const SUPPORT_REFRESH_INTERVAL_MS = 4_000;

export function SupportLiveRefresh({ revision }: { revision: string }) {
  const router = useRouter();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const thread = document.querySelector<HTMLElement>(
        '[data-support-thread="true"]',
      );
      thread?.scrollTo({ top: thread.scrollHeight, behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [revision]);

  useEffect(() => {
    const refreshVisibleThread = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const interval = window.setInterval(
      refreshVisibleThread,
      SUPPORT_REFRESH_INTERVAL_MS,
    );

    window.addEventListener("focus", refreshVisibleThread);
    document.addEventListener("visibilitychange", refreshVisibleThread);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshVisibleThread);
      document.removeEventListener("visibilitychange", refreshVisibleThread);
    };
  }, [router]);

  return null;
}
