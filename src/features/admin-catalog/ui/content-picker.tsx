"use client";

import { useState } from "react";

type Item = { id: string; title: string; examName: string };
export type SellableItems = { tests: Item[]; materials: Item[] };

export function ContentPicker({ items }: { items: SellableItems }) {
  const [query, setQuery] = useState("");
  const [exam, setExam] = useState("");
  const [kind, setKind] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const all = [...items.tests.map(item => ({ ...item, kind: "Test", field: "testIds" })), ...items.materials.map(item => ({ ...item, kind: "Material", field: "materialIds" }))];
  const exams = [...new Set(all.map(item => item.examName))];
  const chosen = new Set(selected);
  const visible = all.filter(item => (!exam || item.examName === exam) && (!kind || item.kind === kind) && (!selectedOnly || chosen.has(`${item.field}:${item.id}`)) && item.title.toLowerCase().includes(query.trim().toLowerCase()));
  const selectedItems = all.filter(item => chosen.has(`${item.field}:${item.id}`));
  return <div>
    <h3>Choose what students get</h3><p>Select one item to sell individually, or combine tests and materials into a bundle.</p>
    <div className="question-grid">
      <label className="field"><span>Search content title</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <label className="field"><span>Exam</span><select value={exam} onChange={event => setExam(event.target.value)}><option value="">All exams</option>{exams.map(item => <option key={item}>{item}</option>)}</select></label>
      <label className="field"><span>Content type</span><select value={kind} onChange={event => setKind(event.target.value)}><option value="">Tests and materials</option><option>Test</option><option>Material</option></select></label>
    </div>
    <label className="check-row"><input type="checkbox" checked={selectedOnly} onChange={event => setSelectedOnly(event.target.checked)} /> Show selected only</label>
    <p role="status">{selectedItems.length} selected · {visible.length} matching. Selections stay saved when filters change.</p>
    {selectedItems.map(item => <input type="hidden" name={item.field} value={item.id} key={`${item.field}:${item.id}`} />)}
    {visible.map(item => { const key = `${item.field}:${item.id}`; return <label className="check-row" key={key}><input type="checkbox" checked={chosen.has(key)} onChange={event => { const checked = event.target.checked; setSelected(current => checked ? [...new Set([...current, key])] : current.filter(value => value !== key)); }} /><span>{item.kind} · {item.examName} · {item.title}</span></label>; })}
    {!all.length ? <p className="notice">Publish an exam and its content first. You can save an empty draft for now.</p> : !visible.length && <p className="muted">No matching content. Clear filters or try another title.</p>}
    <button type="button" className="text-button" onClick={() => { setQuery(""); setExam(""); setKind(""); setSelectedOnly(false); }}>Clear content filters</button>
  </div>;
}

export function SearchableContentSelect({ items, label }: { items: { id: string; title: string; examName?: string; mode?: string; type?: string }[]; label: string }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const visible = items.filter(item => `${item.examName ?? ""} ${item.title} ${item.type ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()));
  const value = visible.some(item => item.id === selected) ? selected : visible[0]?.id ?? "";
  return <div><label className="field"><span>Search {label.toLowerCase()}</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Title or exam" /></label><label className="field"><span>{label}</span><select name="id" value={value} onChange={event => setSelected(event.target.value)} required><option value="" disabled>Choose {label.toLowerCase()}</option>{visible.map(item => <option value={item.id} key={item.id}>{item.examName ? `${item.examName} · ` : ""}{item.title}{item.type ? ` · ${item.type}` : ""}</option>)}</select></label>{!visible.length && <p className="muted">No matches. Clear the search to see available content.</p>}</div>;
}
