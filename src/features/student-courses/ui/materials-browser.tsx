"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatIndiaDate } from "@/lib/date-time";

type Material = {
  id: string;
  title: string;
  subject: string;
  topic: string;
  type: "PDF" | "VIDEO" | "FILE";
  version: number | null;
  originalFileName: string | null;
  sizeBytes: number | null;
  lastAccessed: string | null;
  viewed: boolean;
};

const tableGrid =
  "grid grid-cols-[minmax(15rem,1.6fr)_.5fr_.55fr_.45fr_2rem] items-center gap-[.7rem] px-[.8rem] py-[.7rem] max-[700px]:grid-cols-[minmax(0,1fr)_auto]";
const tableRow = `${tableGrid} relative border-t border-[#eceae7] bg-white pl-[3.4rem] text-left text-[.72rem] text-[#353a3e] hover:bg-[#fffaf7] max-[700px]:pl-[3.4rem] max-[700px]:[&>span]:hidden`;
const folderIcon = "absolute left-4 text-2xl not-italic text-[#ffab36]";
const rowTitle =
  "grid min-w-0 gap-[.15rem] [&>small]:text-[.62rem] [&>small]:font-normal [&>small]:text-prep-muted";
const filterButton = (active = false) =>
  `min-h-9 rounded-[.38rem] border px-[.9rem] py-[.45rem] text-[.7rem] font-semibold ${
    active
      ? "border-prep-orange bg-prep-orange text-white"
      : "border-[#dedfe1] bg-white text-[#4e555a]"
  }`;

function bytes(value: number | null) {
  if (!value) return "Online";
  return value < 1024 * 1024
    ? `${Math.ceil(value / 1024)} KB`
    : `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function MaterialsBrowser({
  materials,
  courseSlug,
}: {
  materials: Material[];
  courseSlug: string;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"ALL" | Material["type"]>("ALL");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return materials.filter(
      (item) =>
        (type === "ALL" || item.type === type) &&
        (!selectedSubject || item.subject === selectedSubject) &&
        (!normalizedQuery ||
          `${item.title} ${item.subject} ${item.topic} ${item.originalFileName ?? ""}`
            .toLowerCase()
            .includes(normalizedQuery)),
    );
  }, [materials, query, type, selectedSubject]);

  const groups = useMemo(
    () =>
      Array.from(new Set(materials.map((item) => item.subject))).map(
        (subject) => {
          const entries = materials.filter((item) => item.subject === subject);
          const opened = entries.filter((item) => item.viewed).length;
          return {
            subject,
            entries,
            progress: entries.length
              ? Math.round((opened / entries.length) * 100)
              : 0,
            last:
              entries
                .map((item) => item.lastAccessed)
                .filter((value): value is string => Boolean(value))
                .sort()
                .at(-1) ?? null,
          };
        },
      ),
    [materials],
  );

  const tabs: ["ALL" | Material["type"], string][] = [
    ["ALL", "All"],
    ["PDF", "PDFs"],
    ["VIDEO", "Videos"],
    ["FILE", "Notes"],
  ];
  const showFiles = Boolean(selectedSubject || query || type !== "ALL");

  return (
    <section className="min-w-0">
      <div className="flex items-start justify-between gap-6 max-[700px]:flex-col max-[700px]:items-stretch">
        <div>
          <h2 className="m-0 text-[1.25rem] font-bold">
            {selectedSubject ?? "Course resources"}
          </h2>
          <p className="mt-1 mb-0 text-[.78rem] leading-relaxed text-prep-muted">
            {selectedSubject
              ? "Browse every resource in this subject."
              : "Select a subject or search across all package resources."}
          </p>
        </div>
        <label className="flex h-[2.6rem] w-[min(100%,21rem)] items-center gap-[.6rem] rounded-[.4rem] border border-[#dedfe1] bg-white px-[.8rem] focus-within:border-prep-orange max-[700px]:w-full">
          <svg
            className="size-4 shrink-0 text-[#7a8186]"
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            className="min-w-0 flex-1 border-0 bg-transparent text-[.75rem] outline-none"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search topics, files or keywords…"
            aria-label="Search study materials"
          />
        </label>
      </div>

      <div className="my-4 flex items-center justify-between gap-4 max-[700px]:flex-col max-[700px]:items-stretch">
        <nav className="flex flex-wrap gap-[.55rem]" aria-label="Resource type">
          {tabs.map(([key, label]) => (
            <button
              className={filterButton(type === key)}
              type="button"
              aria-pressed={type === key}
              onClick={() => setType(key)}
              key={key}
            >
              {label}
            </button>
          ))}
        </nav>
        {selectedSubject ? (
          <button
            className={`${filterButton()} text-prep-orange-dark`}
            type="button"
            onClick={() => setSelectedSubject(null)}
          >
            ← All subjects
          </button>
        ) : (
          <span className="text-[.72rem] text-prep-muted">
            {materials.length} resources
          </span>
        )}
      </div>

      {!showFiles ? (
        <div className="overflow-hidden rounded-[.45rem] border border-[#e2e0dd] bg-white">
          <div
            className={`${tableGrid} bg-[#faf9f7] text-[.65rem] text-[#6d747a] max-[700px]:hidden`}
            aria-hidden="true"
          >
            <span>Name</span>
            <span>Items</span>
            <span>Progress</span>
            <span>Last accessed</span>
            <span>Open</span>
          </div>
          {groups.map((group) => (
            <button
              className={`${tableRow} w-full cursor-pointer`}
              type="button"
              onClick={() => setSelectedSubject(group.subject)}
              key={group.subject}
            >
              <i className={folderIcon} aria-hidden="true">
                ▰
              </i>
              <strong className={rowTitle}>
                {group.subject}
                <small>
                  {new Set(group.entries.map((item) => item.topic)).size} topics
                </small>
              </strong>
              <span>{group.entries.length} items</span>
              <span>
                <progress
                  className="mr-[.4rem] h-[.35rem] w-[4.5rem] accent-prep-orange"
                  max="100"
                  value={group.progress}
                  aria-label={`${group.subject} progress`}
                />
                {group.progress}%
              </span>
              <span>
                {group.last
                  ? formatIndiaDate(group.last, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Not opened"}
              </span>
              <b className="text-center text-lg" aria-hidden="true">
                ›
              </b>
            </button>
          ))}
        </div>
      ) : visible.length ? (
        <div className="overflow-hidden rounded-[.45rem] border border-[#e2e0dd] bg-white">
          <div
            className={`${tableGrid} bg-[#faf9f7] text-[.65rem] text-[#6d747a] max-[700px]:hidden`}
            aria-hidden="true"
          >
            <span>Name</span>
            <span>Type</span>
            <span>Size</span>
            <span>Last accessed</span>
            <span>Open</span>
          </div>
          {visible.map((material) => (
            <Link
              className={tableRow}
              href={`/library/${material.id}?course=${courseSlug}`}
              key={material.id}
            >
              <i className={folderIcon} aria-hidden="true">
                ▰
              </i>
              <strong className={rowTitle}>
                {material.title}
                <small>{material.topic}</small>
              </strong>
              <span>{material.type}</span>
              <span>{bytes(material.sizeBytes)}</span>
              <span>
                {material.lastAccessed
                  ? formatIndiaDate(material.lastAccessed, {
                      day: "numeric",
                      month: "short",
                    })
                  : "Not opened"}
              </span>
              <b className="text-center text-lg" aria-hidden="true">
                ›
              </b>
            </Link>
          ))}
        </div>
      ) : (
        <section className="rounded-[.45rem] border border-dashed border-[#d8d5d0] bg-white p-8 text-center text-sm text-prep-muted">
          <p>No study materials match this search.</p>
        </section>
      )}
    </section>
  );
}
