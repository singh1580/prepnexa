"use client";

import { useMemo, useState } from "react";
import { UiIcon } from "@/components/ui-icon";
import { adminControl } from "@/components/admin-styles";

type Item = { id: string; title: string; mode?: string; type?: string };
export type SellableItems = { tests: Item[]; materials: Item[] };

function MultiSelect({
  title,
  hint,
  field,
  items,
}: {
  title: string;
  hint: string;
  field: "testIds" | "materialIds";
  items: Item[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) =>
      `${item.title} ${item.mode ?? ""} ${item.type ?? ""}`
        .toLowerCase()
        .includes(needle),
    );
  }, [items, query]);
  const chosen = new Set(selected);
  return (
    <section className="relative">
      <div className="mb-[0.45rem] flex items-end justify-between gap-4 max-[650px]:flex-col max-[650px]:items-start max-[650px]:gap-1">
        <strong className="text-[0.85rem]">{title}</strong>
        <span className="text-[0.7rem] text-prep-muted">
          {selected.length ? `${selected.length} selected` : hint}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto] rounded-[0.55rem] border border-[#c9c1b8] bg-white focus-within:border-prep-orange focus-within:ring-2 focus-within:ring-[#ffdfd2]">
        <input
          className="h-11 min-w-0 border-0 bg-transparent px-3 outline-none"
          type="search"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          placeholder={`Search and select ${title.toLowerCase()}…`}
        />
        <button
          className="grid w-[2.6rem] place-items-center border-0 bg-transparent text-prep-muted [&_svg]:size-4"
          type="button"
          aria-label={`Show ${title.toLowerCase()}`}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <UiIcon name="chevron" />
        </button>
      </div>
      {selected.map((id) => (
        <input key={id} type="hidden" name={field} value={id} />
      ))}
      {open && (
        <div className="absolute inset-x-0 top-[4.5rem] z-20 max-h-56 overflow-auto rounded-[0.6rem] border border-prep-line bg-white p-2 shadow-[0_0.9rem_2.5rem_#271a1430]">
          {visible.map((item) => (
            <label
              className="flex cursor-pointer items-start gap-3 rounded-[0.4rem] p-2 hover:bg-[#fff5ef] [&_input]:mt-1 [&_input]:accent-prep-orange [&_span]:grid [&_span]:min-w-0 [&_small]:text-[0.68rem] [&_small]:text-prep-muted [&_strong]:text-[0.76rem] [&_strong]:[overflow-wrap:anywhere]"
              key={item.id}
            >
              <input
                type="checkbox"
                checked={chosen.has(item.id)}
                onChange={(event) =>
                  setSelected((current) =>
                    event.target.checked
                      ? [...new Set([...current, item.id])]
                      : current.filter((id) => id !== item.id),
                  )
                }
              />
              <span>
                <strong>{item.title}</strong>
                <small>
                  {item.mode?.replaceAll("_", " ") ?? item.type ?? "Saved item"}
                </small>
              </span>
            </label>
          ))}
          {!visible.length && (
            <p className="p-2 text-sm text-prep-muted">
              {items.length ? "No matching items." : "Nothing available yet."}
            </p>
          )}
        </div>
      )}
      {selected.length > 0 && (
        <div className="mt-[0.55rem] flex flex-wrap gap-[0.4rem]">
          {selected.map((id) => {
            const item = items.find((candidate) => candidate.id === id);
            return item ? (
              <span
                className="flex items-center gap-[0.35rem] rounded-[0.35rem] bg-[#eee9e3] px-2 py-[0.32rem] text-[0.7rem] text-[#45474b]"
                key={id}
              >
                {item.title}
                <button
                  className="border-0 bg-transparent text-[#8f3d21] [&_svg]:size-3.5"
                  type="button"
                  aria-label={`Remove ${item.title}`}
                  onClick={() =>
                    setSelected((current) =>
                      current.filter((value) => value !== id),
                    )
                  }
                >
                  <UiIcon name="close" />
                </button>
              </span>
            ) : null;
          })}
        </div>
      )}
    </section>
  );
}

export function ContentPicker({ items }: { items: SellableItems }) {
  return (
    <div className="grid gap-4">
      <MultiSelect
        title="Add study material"
        hint="Select one or more files or videos from Store & materials."
        field="materialIds"
        items={items.materials}
      />
      <MultiSelect
        title="Add tests & practice sets"
        hint="Select one or more items from Tests & practice sets."
        field="testIds"
        items={items.tests}
      />
    </div>
  );
}

export function SearchableContentSelect({
  items,
  label,
}: {
  items: Item[];
  label: string;
}) {
  const [query, setQuery] = useState("");
  const visible = items.filter((item) =>
    item.title.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <div className="grid gap-3">
      <label className="grid gap-1 text-[0.76rem] font-bold text-[#596168]">
        <span>Search {label.toLowerCase()}</span>
        <input
          className={adminControl}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <label className="grid gap-1 text-[0.76rem] font-bold text-[#596168]">
        <span>{label}</span>
        <select className={adminControl} name="id" required>
          {visible.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
