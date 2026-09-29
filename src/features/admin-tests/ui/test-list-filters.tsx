import Link from "next/link";
import { testCategoryLabels } from "../categories";

export function TestListFilters({ initial }: { initial: { query: string; category: string; mode: string } }) {
  return (
    <form className="list-filter-bar" method="get" action="/admin/tests">
      <label className="compact-search"><span className="sr-only">Search tests</span><input name="q" defaultValue={initial.query} maxLength={160} type="search" placeholder="Search tests & practice sets…" /></label>
      <details className="filter-popover">
        <summary className="button secondary">Filters</summary>
        <div className="filter-popover-panel">
          <label className="field"><span>Format</span><select name="mode" defaultValue={initial.mode}><option value="">All formats</option><option value="MOCK">Mock tests</option><option value="PRACTICE">Practice sets</option></select></label>
          <label className="field"><span>Test type</span><select name="category" defaultValue={initial.category}><option value="">All types</option>{Object.entries(testCategoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}<option value="UNCLASSIFIED">Uncategorised</option></select></label>
          <div className="form-actions"><button className="button" type="submit">Apply</button><Link className="button secondary" href="/admin/tests">Clear</Link></div>
        </div>
      </details>
      <button className="button" type="submit">Search</button>
    </form>
  );
}
