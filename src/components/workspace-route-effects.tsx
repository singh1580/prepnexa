"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function WorkspaceRouteEffects() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const packageView = searchParams.get("view");

  useEffect(() => {
    window.scrollTo(0, 0);
    document
      .querySelectorAll<HTMLElement>(
        ".admin-table-wrap, .table-scroll, .orders-table-wrap, .review-table-wrap",
      )
      .forEach((element) => element.scrollTo({ left: 0, top: 0 }));
  }, [pathname, packageView]);

  return null;
}
