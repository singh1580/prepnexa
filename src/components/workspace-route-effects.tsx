"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function WorkspaceRouteEffects() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const packageView = searchParams.get("view");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, packageView]);

  return null;
}
