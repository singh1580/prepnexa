"use client";

import { useState, type ReactNode } from "react";

type TabKey = "description" | "syllabus" | "included" | "reviews" | "faqs";
const tabs: [TabKey, string][] = [
  ["description", "Description"],
  ["syllabus", "Syllabus"],
  ["included", "What's included"],
  ["reviews", "Reviews"],
  ["faqs", "FAQs"],
];

export function ProductDetailTabs({
  panels,
}: {
  panels: Record<TabKey, ReactNode>;
}) {
  const [active, setActive] = useState<TabKey>("description");
  return (
    <section>
      <nav
        className="sticky top-[4.75rem] z-[9] mt-[1.3rem] flex max-w-full gap-12 overflow-x-auto border-b border-[#deddda] bg-white [scrollbar-width:thin] max-[800px]:top-[4.4rem] max-[800px]:gap-6 max-[700px]:static max-[700px]:mt-4 max-[700px]:gap-1 max-[700px]:overscroll-x-contain max-[700px]:p-0"
        aria-label="Package details"
        role="tablist"
      >
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            className={`min-h-11 shrink-0 cursor-pointer appearance-none border-0 border-b-2 bg-transparent px-3 py-4 pb-[0.9rem] text-[0.76rem] whitespace-nowrap transition-colors max-[700px]:px-[0.65rem] max-[700px]:py-[0.7rem] max-[420px]:text-[0.7rem] ${
              active === key
                ? "border-[#ee4b17] text-[#e34410]"
                : "border-transparent text-[#4f555b] hover:border-[#ee4b17] hover:text-[#e34410] focus-visible:border-[#ee4b17] focus-visible:text-[#e34410]"
            }`}
            aria-selected={active === key}
            aria-controls={`package-panel-${key}`}
            id={`package-tab-${key}`}
            onClick={() => setActive(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div
        className="min-h-0 bg-white py-5 max-[560px]:pt-[1.05rem] max-[560px]:pb-[0.9rem] [&>section>h2]:my-[0.1rem] [&>section>h2]:mb-4 [&>section>h2]:text-[1.35rem] [&>section>p]:max-w-[60rem] [&>section>p]:leading-[1.65] [&>section>p]:text-[#5e646b] [&>section>details]:border-t [&>section>details]:border-[#e4e1dd] [&>section>details]:py-[0.9rem] [&>section>details_summary]:cursor-pointer [&>section>details_summary]:font-bold [&>section>:last-child]:mb-0"
        id={`package-panel-${active}`}
        role="tabpanel"
        aria-labelledby={`package-tab-${active}`}
      >
        {panels[active]}
      </div>
    </section>
  );
}
