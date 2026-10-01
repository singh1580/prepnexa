"use client";

import { useMemo, useState } from "react";

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
      `${item.title} ${item.mode ?? ""} ${item.type ?? ""}`.toLowerCase().includes(needle),
    );
  }, [items, query]);
  const chosen = new Set(selected);
  return (
    <section className="package-multiselect">
      <div className="multiselect-label"><strong>{title}</strong><span>{selected.length ? `${selected.length} selected` : hint}</span></div>
      <div className="multiselect-control">
        <input type="search" value={query} onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} placeholder={`Search and select ${title.toLowerCase()}…`} />
        <button type="button" aria-label={`Show ${title.toLowerCase()}`} onClick={() => setOpen((value) => !value)}>⌄</button>
      </div>
      {selected.map((id) => <input key={id} type="hidden" name={field} value={id} />)}
      {open && <div className="multiselect-menu">
        {visible.map((item) => (
          <label className="content-choice" key={item.id}>
            <input
              type="checkbox"
              checked={chosen.has(item.id)}
              onChange={(event) => setSelected((current) => event.target.checked ? [...new Set([...current, item.id])] : current.filter((id) => id !== item.id))}
            />
            <span><strong>{item.title}</strong><small>{item.mode?.replaceAll("_", " ") ?? item.type ?? "Saved item"}</small></span>
          </label>
        ))}
        {!visible.length && <p className="muted">{items.length ? "No matching items." : "Nothing available yet."}</p>}
      </div>}
      {selected.length > 0 && <div className="selected-content-chips">{selected.map((id) => { const item = items.find((candidate) => candidate.id === id); return item ? <span key={id}>{item.title}<button type="button" aria-label={`Remove ${item.title}`} onClick={() => setSelected((current) => current.filter((value) => value !== id))}>×</button></span> : null; })}</div>}
    </section>
  );
}

export function ContentPicker({ items }: { items: SellableItems }) {
  return (
    <div className="package-content-picker">
      <MultiSelect title="Add study material" hint="Select one or more files or videos from Store & materials." field="materialIds" items={items.materials} />
      <MultiSelect title="Add tests & practice sets" hint="Select one or more items from Tests & practice sets." field="testIds" items={items.tests} />
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
  const visible = items.filter((item) => item.title.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div className="searchable-select">
      <label className="field"><span>Search {label.toLowerCase()}</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <label className="field"><span>{label}</span><select name="id" required>{visible.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
    </div>
  );
}
