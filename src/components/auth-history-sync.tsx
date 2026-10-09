"use client";

import { useEffect } from "react";

// History restores can contain a page rendered before the session cookie changed.
export function AuthHistorySync() {
  useEffect(() => {
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);
  return null;
}
