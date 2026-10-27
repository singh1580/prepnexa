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
        className={`hidden max-[1100px]:flex max-[1100px]:h-[2.7rem] max-[1100px]:w-full max-[1100px]:cursor-pointer max-[1100px]:items-center max-[1100px]:gap-[0.48rem] max-[1100px]:rounded-[0.55rem] max-[1100px]:border max-[1100px]:px-[0.72rem] max-[1100px]:text-[0.7rem] max-[1100px]:font-bold max-[1100px]:text-[#272a2d] max-[560px]:col-start-2 max-[340px]:px-[0.58rem] max-[340px]:text-[0.66rem] [&_svg]:h-[0.95rem] [&_svg]:w-[0.95rem] [&_svg]:shrink-0 [&_svg]:fill-none [&_svg]:stroke-[#d74312] [&_svg]:stroke-[1.8] [&_svg]:[stroke-linecap:round] ${
          open
            ? "max-[1100px]:border-[#ef9d7e] max-[1100px]:bg-[#fffaf7] max-[1100px]:shadow-[0_0_0_2px_rgba(232,71,20,0.08)]"
            : "max-[1100px]:border-[#ddd9d4] max-[1100px]:bg-white"
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
        className={`${open ? "max-[1100px]:grid" : "max-[1100px]:hidden"} sticky top-[5.75rem] rounded-[0.45rem] border border-[#e3e1de] bg-white max-[1100px]:static max-[1100px]:mt-3 max-[1100px]:grid-cols-2 max-[560px]:col-span-full max-[560px]:mt-0 max-[560px]:grid-cols-1 max-[560px]:overflow-hidden max-[560px]:rounded-[0.65rem] max-[560px]:border-[#e2ded9]`}
        id={panelId}
      >
        {children}
      </aside>
    </div>
  );
}
