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
    <div className="min-w-0 max-[560px]:contents">
      <button
        aria-controls={panelId}
        aria-expanded={open}
        className={`hidden max-[560px]:col-start-2 max-[560px]:flex max-[560px]:h-[2.7rem] max-[560px]:w-full max-[560px]:cursor-pointer max-[560px]:items-center max-[560px]:gap-[0.48rem] max-[560px]:rounded-[0.55rem] max-[560px]:border max-[560px]:px-[0.72rem] max-[560px]:text-[0.7rem] max-[560px]:font-bold max-[560px]:text-[#272a2d] max-[340px]:px-[0.58rem] max-[340px]:text-[0.66rem] [&_svg]:h-[0.95rem] [&_svg]:w-[0.95rem] [&_svg]:shrink-0 [&_svg]:fill-none [&_svg]:stroke-[#d74312] [&_svg]:stroke-[1.8] [&_svg]:[stroke-linecap:round] ${
          open
            ? "max-[560px]:border-[#ef9d7e] max-[560px]:bg-[#fffaf7] max-[560px]:shadow-[0_0_0_2px_rgba(232,71,20,0.08)]"
            : "max-[560px]:border-[#ddd9d4] max-[560px]:bg-white"
        }`}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
        <span>Filters</span>
        {activeCount > 0 ? (
          <b className="grid h-[1.2rem] w-[1.2rem] place-items-center rounded-full bg-[#fff0e9] text-[0.62rem] text-[#c83d0b]">
            {activeCount}
          </b>
        ) : null}
        <i
          aria-hidden="true"
          className={`ml-auto h-[0.48rem] w-[0.48rem] border-r-[1.5px] border-b-[1.5px] transition-transform duration-150 ${open ? "rotate-[225deg] translate-[-1px]" : "rotate-45 -translate-y-0.5"}`}
        />
      </button>
      <aside
        className={`${open ? "max-[560px]:grid" : "max-[560px]:hidden"} sticky top-[5.75rem] rounded-[0.45rem] border border-[#e3e1de] bg-white max-[800px]:static max-[800px]:grid max-[800px]:grid-cols-2 max-[560px]:col-span-full max-[560px]:mt-0 max-[560px]:grid-cols-1 max-[560px]:overflow-hidden max-[560px]:rounded-[0.65rem] max-[560px]:border-[#e2ded9]`}
        id={panelId}
      >
        {children}
      </aside>
    </div>
  );
}
