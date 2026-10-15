"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { UiIcon } from "./ui-icon";

export function SidebarDisclosure({
  className,
  defaultOpen = false,
  openKey,
  label,
  trigger,
  triggerToggles = false,
  children,
}: {
  className: string;
  defaultOpen?: boolean;
  openKey?: string;
  label: string;
  trigger: ReactNode;
  triggerToggles?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const previousOpenKey = useRef(openKey);

  useEffect(() => {
    if (openKey && openKey !== previousOpenKey.current) setOpen(true);
    previousOpenKey.current = openKey;
  }, [openKey]);

  const primary = triggerToggles ? (
    <button
      className="sidebar-disclosure-primary"
      type="button"
      aria-expanded={open}
      onClick={() => setOpen((value) => !value)}
    >
      {trigger}
    </button>
  ) : (
    trigger
  );

  return (
    <div className={className} data-open={open ? "true" : "false"}>
      <div className="sidebar-disclosure-summary">
        {primary}
        <button
          className="sidebar-disclosure-toggle"
          type="button"
          aria-expanded={open}
          aria-label={`${open ? "Collapse" : "Expand"} ${label}`}
          onClick={() => setOpen((value) => !value)}
        >
          <UiIcon name="chevron" />
        </button>
      </div>
      {open ? children : null}
    </div>
  );
}
