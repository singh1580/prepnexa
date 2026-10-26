import Link from "next/link";
import { testCategoryLabels } from "../categories";
import {
  adminControl,
  adminPrimaryButton,
  adminSecondaryButton,
} from "@/components/admin-styles";

export function TestListFilters({
  initial,
}: {
  initial: { query: string; category: string; mode: string };
}) {
  return (
    <form
      className="relative mb-4 flex items-center gap-[0.65rem]"
      method="get"
      action="/admin/tests"
    >
      <label className="flex-1">
        <span className="sr-only">Search tests</span>
        <input
          className={adminControl}
          name="q"
          defaultValue={initial.query}
          maxLength={160}
          type="search"
          placeholder="Search tests & practice sets…"
        />
      </label>
      <details className="group relative">
        <summary
          className={`${adminSecondaryButton} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
        >
          Filters
        </summary>
        <div className="absolute top-[calc(100%+0.45rem)] right-0 z-20 grid w-[min(22rem,calc(100vw-2rem))] gap-3 rounded-[0.65rem] border border-prep-line bg-white p-4 shadow-[0_1rem_2.6rem_rgba(33,28,24,0.16)]">
          <label className="grid gap-1 text-[0.76rem] font-bold text-[#596168]">
            <span>Format</span>
            <select
              className={adminControl}
              name="mode"
              defaultValue={initial.mode}
            >
              <option value="">All formats</option>
              <option value="MOCK">Mock tests</option>
              <option value="PRACTICE">Practice sets</option>
            </select>
          </label>
          <label className="grid gap-1 text-[0.76rem] font-bold text-[#596168]">
            <span>Test type</span>
            <select
              className={adminControl}
              name="category"
              defaultValue={initial.category}
            >
              <option value="">All types</option>
              {Object.entries(testCategoryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
              <option value="UNCLASSIFIED">Uncategorised</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button className={adminPrimaryButton} type="submit">
              Apply
            </button>
            <Link className={adminSecondaryButton} href="/admin/tests">
              Clear
            </Link>
          </div>
        </div>
      </details>
    </form>
  );
}
