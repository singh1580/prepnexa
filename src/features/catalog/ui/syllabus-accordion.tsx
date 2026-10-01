"use client";

import { useRef, useState } from "react";

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

  return <div className="syllabus-accordion" ref={root}>
    <div className="syllabus-heading"><h2>Syllabus</h2><button type="button" onClick={toggleAll}>{expanded ? "Collapse all" : "Expand all"}<span aria-hidden="true">⌄</span></button></div>
    <div className="syllabus-rows">{topics.map((topic, index) => <details key={`${topic}-${index}`} onToggle={() => {
      const items = [...(root.current?.querySelectorAll("details") ?? [])];
      setExpanded(items.length > 0 && items.every((item) => item.open));
    }}><summary><span>{index + 1}</span><b>{topic}</b><small>View details</small><i aria-hidden="true">⌄</i></summary><p>This section is included in the package. Its linked lessons, notes and practice content become available in My Packages after purchase.</p></details>)}</div>
  </div>;
}
