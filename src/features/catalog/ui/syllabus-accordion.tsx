"use client";

import { useRef, useState } from "react";
import { UiIcon } from "@/components/ui-icon";

export function SyllabusAccordion({ topics }: { topics: string[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  function toggleAll() {
    const next = !expanded;
    root.current?.querySelectorAll("details").forEach((item) => {
      item.open = next;
    });
    setExpanded(next);
  }

  return (
    <div ref={root}>
      <div className="flex items-center justify-between">
        <h2 className="my-[0.1rem] mb-4 text-[1.35rem]">Syllabus</h2>
        <button
          type="button"
          className="flex cursor-pointer items-center gap-[0.4rem] border-0 bg-transparent font-bold text-[#e84410] [&_span]:grid [&_span]:place-items-center [&_svg]:h-4 [&_svg]:w-4"
          onClick={toggleAll}
        >
          {expanded ? "Collapse all" : "Expand all"}
          <span>
            <UiIcon name="chevron" />
          </span>
        </button>
      </div>
      <div className="grid gap-[0.45rem]">
        {topics.map((topic, index) => (
          <details
            className="group rounded-[0.4rem] border border-[#dfdfdd] bg-white"
            key={`${topic}-${index}`}
            onToggle={() => {
              const items = [
                ...(root.current?.querySelectorAll("details") ?? []),
              ];
              setExpanded(items.length > 0 && items.every((item) => item.open));
            }}
          >
            <summary className="grid cursor-pointer list-none grid-cols-[1.8rem_minmax(0,1fr)_auto_auto] items-center gap-[0.7rem] px-4 py-[0.8rem] [&::-webkit-details-marker]:hidden">
              <span className="grid h-[1.55rem] w-[1.55rem] place-items-center rounded-full bg-[#f0f0ef] text-[0.68rem]">
                {index + 1}
              </span>
              <b className="text-[0.78rem]">{topic}</b>
              <small className="text-[0.64rem] text-[#6e7378]">
                View details
              </small>
              <i className="grid place-items-center not-italic transition-transform group-open:rotate-180 [&_svg]:h-4 [&_svg]:w-4">
                <UiIcon name="chevron" />
              </i>
            </summary>
            <p className="m-0 px-14 pb-4 text-[0.75rem] leading-[1.55] text-[#6b7076]">
              This section is included in the package. Its linked lessons, notes
              and practice content become available in My Packages after
              purchase.
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
