"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Result = { id: string; slug: string; name: string; pricePaise: number };
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}
export function PublicSearch({
  variant = "public",
}: {
  variant?: "public" | "student" | "admin";
}) {
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (q.trim().length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/catalog/search?q=${encodeURIComponent(q)}`,
          { signal: controller.signal },
        );
        if (response.ok) setResults((await response.json()).data ?? []);
      } catch {}
    }, 180);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [q]);
  function updateQuery(value: string) {
    setQ(value);
    if (value.trim().length < 2) setResults([]);
  }
  if (variant === "public" && pathname === "/") {
    return <div className="w-full max-w-[31rem]" aria-hidden="true" />;
  }
  return (
    <div
      className={`public-live-search relative w-full ${variant === "public" ? "max-w-[31rem]" : variant === "student" ? "ml-auto w-[min(28rem,42vw)] max-w-[28rem] max-[1099px]:hidden" : "min-w-0 max-w-none max-[1099px]:hidden"}`}
    >
      <form
        className="header-search relative w-full"
        action="/packages"
        role="search"
      >
        <input
          className={`w-full border bg-[#fafafa] py-2 pr-[0.9rem] pl-[2.4rem] text-prep-ink outline-none transition-[border-color,box-shadow] placeholder:text-[#85878b] focus:border-[#f07950] focus:shadow-[0_0_0_3px_rgb(239_77_24_/_10%)] ${variant === "public" ? "h-[2.55rem] rounded-full border-[#d9dadd] bg-[#f7f5f1] text-[0.76rem]" : variant === "student" ? "h-[2.65rem] rounded-[0.45rem] border-[#dedbd7] text-[0.84rem]" : "h-[2.55rem] rounded-[0.42rem] border-[#dedfe1] text-[0.78rem]"}`}
          role="combobox"
          name="q"
          value={q}
          onChange={(event) => updateQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          autoComplete="off"
          aria-label="Search packages"
          aria-autocomplete="list"
          aria-expanded={focused && q.trim().length >= 2}
          aria-controls="public-search-results"
          placeholder="Search exams or packages"
        />
        <span
          className="pointer-events-none absolute top-1/2 left-[0.8rem] size-4 -translate-y-1/2 [&>svg]:size-4 [&>svg]:fill-none [&>svg]:stroke-[#85878b] [&>svg]:stroke-[1.7]"
          aria-hidden="true"
        >
          <SearchIcon />
        </span>
      </form>
      {focused && q.trim().length >= 2 && (
        <div
          id="public-search-results"
          className="absolute top-[calc(100%+0.55rem)] right-0 left-0 z-[70] overflow-hidden rounded-xl border border-[#ddd7d0] bg-white p-[0.35rem] text-prep-ink shadow-[0_1.2rem_3.5rem_#0003]"
          role="listbox"
        >
          {results.length ? (
            results.map((result) => (
              <Link
                className="flex items-center justify-between gap-4 rounded-lg p-3 text-[0.8rem] hover:bg-prep-orange-wash"
                role="option"
                aria-selected="false"
                href={`/packages/${result.slug}`}
                key={result.id}
              >
                <span>{result.name}</span>
                <b className="text-prep-orange">
                  {result.pricePaise === 0
                    ? "Free"
                    : new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      }).format(result.pricePaise / 100)}
                </b>
              </Link>
            ))
          ) : (
            <p className="m-0 p-[0.8rem] text-[0.8rem] text-prep-muted">
              No matching packages
            </p>
          )}
          <Link
            className="flex items-center justify-between gap-4 rounded-none border-t border-prep-line p-3 text-[0.8rem] font-bold text-[#b8431d] hover:bg-prep-orange-wash"
            href={`/packages?q=${encodeURIComponent(q)}`}
          >
            See all results →
          </Link>
        </div>
      )}
    </div>
  );
}
