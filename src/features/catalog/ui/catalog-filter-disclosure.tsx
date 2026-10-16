"use client";

import { useId, useState, type ReactNode } from "react";

export function CatalogFilterDisclosure({
  activeCount,
  children,
  defaultOpen = false,
}: {
  activeCount: number;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className={`catalog-filter-disclosure${open ? " is-open" : ""}`}>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        className="catalog-filter-trigger"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
        <span>Filters</span>
        {activeCount > 0 ? <b>{activeCount}</b> : null}
        <i aria-hidden="true" />
      </button>
      <aside className="catalog-sidebar" id={panelId}>
        {children}
      </aside>
    </div>
  );
}
