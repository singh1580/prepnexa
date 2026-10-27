"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatIndiaDate } from "@/lib/date-time";
type Item = {
  id: string;
  title: string;
  subject: string;
  topic: string;
  type: "PDF" | "VIDEO" | "FILE";
  updatedAt: string;
};
function MaterialIcon({ type }: { type: Item["type"] }) {
  return type === "VIDEO" ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m10 8 6 4-6 4z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 2h8l4 4v16H6z" />
      <path d="M14 2v5h5M8.5 16h7M8.5 12h5" />
    </svg>
  );
}
export function MaterialLibrary({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"ALL" | Item["type"]>("ALL");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (item) =>
        (type === "ALL" || item.type === type) &&
        (!q ||
          `${item.title} ${item.subject} ${item.topic}`
            .toLowerCase()
            .includes(q)),
    );
  }, [items, query, type]);
  const filterButton = (active: boolean) =>
    `rounded-[0.3rem] border-0 p-[0.6rem] text-left ${active ? "bg-[#fff0e8] text-[#dc4210]" : "bg-white hover:bg-[#fff0e8] hover:text-[#dc4210]"}`;
  return (
    <>
      <div className="mb-[0.8rem] grid grid-cols-[minmax(16rem,1fr)_auto_auto] items-center gap-[0.6rem] max-[700px]:grid-cols-[1fr_auto]">
        <label className="flex h-[2.65rem] items-center gap-[0.55rem] rounded-[0.4rem] border border-[#dcdedf] bg-white px-3 max-[700px]:col-span-full">
          <svg
            className="size-4 fill-none stroke-[#777e84] stroke-[1.7]"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            className="w-full border-0 bg-transparent outline-0"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search materials by title, subject or topic…"
          />
        </label>
        <details className="relative">
          <summary className="flex h-[2.65rem] cursor-pointer list-none items-center rounded-[0.4rem] border border-[#dcdedf] bg-white px-[0.9rem] font-bold [&::-webkit-details-marker]:hidden">
            ☷ Filters
          </summary>
          <div className="absolute top-[calc(100%+0.4rem)] right-0 z-[8] grid w-48 rounded-[0.4rem] border border-[#ddd] bg-white p-[0.4rem] shadow-[0_1rem_2rem_#2b1c1218]">
            <button
              type="button"
              className={filterButton(type === "ALL")}
              onClick={() => setType("ALL")}
            >
              All materials
            </button>
            <button
              type="button"
              className={filterButton(type === "PDF")}
              onClick={() => setType("PDF")}
            >
              PDFs
            </button>
            <button
              type="button"
              className={filterButton(type === "VIDEO")}
              onClick={() => setType("VIDEO")}
            >
              Videos
            </button>
            <button
              type="button"
              className={filterButton(type === "FILE")}
              onClick={() => setType("FILE")}
            >
              Notes &amp; files
            </button>
          </div>
        </details>
        <div className="flex rounded-[0.4rem] border border-[#dedfe1] p-[0.2rem]">
          <button
            className={`size-[2.2rem] rounded-[0.3rem] border-0 ${layout === "grid" ? "bg-[#ffddd0] text-[#dc4210]" : "bg-white text-[#697076]"}`}
            type="button"
            onClick={() => setLayout("grid")}
            aria-label="Grid view"
          >
            ▦
          </button>
          <button
            className={`size-[2.2rem] rounded-[0.3rem] border-0 ${layout === "list" ? "bg-[#ffddd0] text-[#dc4210]" : "bg-white text-[#697076]"}`}
            type="button"
            onClick={() => setLayout("list")}
            aria-label="List view"
          >
            ☷
          </button>
        </div>
      </div>
      {visible.length ? (
        <div
          className={`grid gap-[0.7rem] ${layout === "grid" ? "grid-cols-3 max-[1000px]:grid-cols-2 max-[700px]:grid-cols-1" : "grid-cols-1"}`}
        >
          {visible.map((item) => (
            <article
              className={`relative overflow-visible rounded-[0.45rem] border border-[#e2e0dd] bg-white ${layout === "list" ? "grid grid-cols-[6rem_1fr_auto] items-center max-[480px]:grid-cols-[5rem_1fr_auto]" : ""}`}
              key={item.id}
            >
              <div
                className={`relative m-[0.55rem] grid place-items-center rounded-[0.38rem] ${layout === "list" ? "h-[4.5rem]" : "h-[8.5rem]"} ${item.type === "VIDEO" ? "bg-[linear-gradient(145deg,#2b3033,#4e5d55)]" : "bg-[linear-gradient(145deg,#f5f6f7,#e9ebee)]"}`}
              >
                <i
                  className={`grid place-items-center text-white ${item.type === "VIDEO" ? "size-16 rounded-full bg-[#ffffff20]" : `h-[3.8rem] w-[3.3rem] rounded-[0.35rem] ${item.type === "FILE" ? "bg-[#7659d7]" : "bg-[#ef4b17]"}`} [&_svg]:size-8 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-[1.5]`}
                >
                  <MaterialIcon type={item.type} />
                </i>
                {item.type === "VIDEO" ? (
                  <b className="absolute grid size-[2.6rem] place-items-center rounded-full border-2 border-white bg-[#202327aa] text-white">
                    ▶
                  </b>
                ) : null}
              </div>
              <div className="px-[0.7rem] pt-[0.15rem] pb-[0.8rem]">
                <h2 className="my-1 text-[0.82rem]">{item.title}</h2>
                <p className="m-0 block text-[0.66rem] text-prep-muted">
                  {item.type} · {item.subject}
                </p>
                <small className="m-0 block text-[0.66rem] text-prep-muted">
                  {item.topic} · Updated{" "}
                  {formatIndiaDate(item.updatedAt, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </small>
              </div>
              <details
                className={`${layout === "list" ? "relative mr-[0.6rem]" : "absolute right-[0.45rem] bottom-[0.55rem]"}`}
              >
                <summary
                  className="grid size-[1.8rem] cursor-pointer list-none place-items-center text-base [&::-webkit-details-marker]:hidden"
                  aria-label={`Actions for ${item.title}`}
                >
                  ⋮
                </summary>
                <div className="absolute right-0 bottom-8 z-[9] grid w-36 rounded-[0.35rem] border border-[#ddd] bg-white p-[0.3rem] shadow-[0_0.7rem_1.5rem_#21150e18] [&_a]:rounded-sm [&_a]:p-[0.55rem] [&_a]:text-[0.68rem] [&_a:hover]:bg-[#fff0e8] [&_a:hover]:text-[#dc4210]">
                  <Link href={`/admin/materials/${item.id}`}>
                    Edit material
                  </Link>
                  <Link href={`/admin/materials/${item.id}`}>Open details</Link>
                </div>
              </details>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-[0.65rem] border border-prep-line bg-white p-6 text-center text-prep-muted">
          <strong>No matching materials</strong>
          <span>Change the search or filter.</span>
        </div>
      )}
    </>
  );
}
