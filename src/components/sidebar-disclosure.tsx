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
  summaryClassName = "",
  primaryClassName = "",
  toggleClassName = "",
  children,
}: {
  className: string;
  defaultOpen?: boolean;
  openKey?: string;
  label: string;
  trigger: ReactNode;
  triggerToggles?: boolean;
  summaryClassName?: string;
  primaryClassName?: string;
  toggleClassName?: string;
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
      className={`flex min-w-0 flex-1 cursor-pointer items-center border-0 bg-transparent p-0 text-left text-inherit [&>span]:min-w-0 [&>span]:overflow-hidden [&>span]:text-ellipsis [&>span]:whitespace-nowrap ${primaryClassName}`}
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
      <div className={`flex min-w-0 items-center ${summaryClassName}`}>
        {primary}
        <button
          className={`grid size-9 shrink-0 cursor-pointer place-items-center rounded-[.4rem] border-0 bg-transparent p-0 text-[#73797e] hover:bg-[#fff0e8] hover:text-prep-orange focus-visible:bg-[#fff0e8] focus-visible:text-prep-orange [&>svg]:size-4 [&>svg]:transition-transform data-[open=true]:[&>svg]:rotate-180 ${toggleClassName}`}
          data-open={open}
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
