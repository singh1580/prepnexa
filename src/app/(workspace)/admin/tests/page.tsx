import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { AdminModal } from "@/components/admin-modal";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { testCategoryLabel } from "@/features/admin-tests/categories";
import { getManagedTests } from "@/features/admin-tests/service";
import { TestCreateForm } from "@/features/admin-tests/ui/forms";
import { TestListFilters } from "@/features/admin-tests/ui/test-list-filters";
import { requireAnyWorkspacePermission } from "@/features/auth/page-access";
import { AdminPageHeader } from "@/components/admin-page-header";

const access = [
  CONTENT_PERMISSIONS.manageTests,
  CONTENT_PERMISSIONS.manageSchedules,
];
const pageSize = 20;
type Params = {
  q?: string | string[];
  category?: string | string[];
  mode?: string | string[];
  page?: string | string[];
};
function text(value: string | string[] | undefined, max = 160) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
export const metadata = { title: "Tests & practice sets" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const filters = await searchParams;
  const query = text(filters.q);
  const category = text(filters.category) as
    "FULL_MOCK" | "SUBJECT_TEST" | "TOPIC_SET" | "UNCLASSIFIED" | "";
  const mode = text(filters.mode) as "MOCK" | "PRACTICE" | "";
  const page = Math.max(1, Number.parseInt(text(filters.page, 5), 10) || 1);
  const auth = await requireAnyWorkspacePermission(access);
  const canManage = auth.permissions.includes(CONTENT_PERMISSIONS.manageTests);
  const result = await getManagedTests({
    query: query || undefined,
    category: category || undefined,
    mode: mode || undefined,
    page,
    pageSize,
  });
  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);
    if (mode) params.set("mode", mode);
    params.set("page", String(target));
    return `/admin/tests?${params.toString()}`;
  };
  return (
    <WorkspaceShell
      admin
      name={auth.user.name}
      email={auth.user.email}
      permissions={auth.permissions}
      section="tests"
    >
      <AdminPageHeader
        title="Tests & Practice Sets"
        description="Create and manage tests and practice sets."
      >
        {canManage && (
          <AdminModal
            label="＋ New test"
            title="Create test or practice set"
            description="Complete the test settings, then add sections and questions in the same test workspace."
            large
          >
            <TestCreateForm />
          </AdminModal>
        )}
      </AdminPageHeader>
      <TestListFilters initial={{ query, category, mode }} />
      {result.items.length ? (
        <div className="overflow-x-auto rounded-lg border border-[#e2e0dd] bg-white">
          <table className="w-full min-w-[760px] border-collapse [&_td]:border-t [&_td]:border-[#e9e7e4] [&_td]:px-[0.7rem] [&_td]:py-[0.78rem] [&_td]:text-[0.7rem] [&_td]:text-[#4b5257] [&_td:first-child]:min-w-52 [&_th]:bg-[#f7f7f6] [&_th]:p-3 [&_th]:text-left [&_th]:text-[0.66rem] [&_th]:text-[#60676d]">
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Mode</th>
                <th>Sections</th>
                <th>Questions</th>
                <th>Duration</th>
                <th>Attempts</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((test) => (
                <tr key={test.id}>
                  <td>
                    <strong className="block text-[0.74rem] text-[#252a2e]">
                      {test.title}
                    </strong>
                    <small className="mt-[0.2rem] block text-[0.61rem] text-prep-muted">
                      {testCategoryLabel(test.category)}
                    </small>
                  </td>
                  <td>
                    {test.mode === "PRACTICE" ? "Practice Set" : "Mock Test"}
                  </td>
                  <td>{test.sectionCount}</td>
                  <td>{test.questionCount}</td>
                  <td>{test.durationMinutes} min</td>
                  <td>{test.attemptCount}</td>
                  <td>
                    <div className="flex gap-[0.35rem]">
                      <Link
                        className="rounded-[0.32rem] border border-[#d8dade] px-[0.58rem] py-[0.42rem] text-[0.65rem] font-bold"
                        href={`/admin/tests/${test.id}#settings`}
                      >
                        Edit
                      </Link>
                      <Link
                        className="rounded-[0.32rem] border border-prep-orange bg-prep-orange px-[0.58rem] py-[0.42rem] text-[0.65rem] font-bold text-white"
                        href={`/admin/tests/${test.id}`}
                      >
                        Open
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-[0.65rem] border border-prep-line bg-white p-6 text-center text-prep-muted">
          <span className="mb-3 text-4xl text-prep-orange">▣</span>
          <strong>No tests or practice sets</strong>
          <span>Create your first item or change the active filters.</span>
        </div>
      )}
      {result.totalPages > 1 && (
        <nav
          className="mt-4 flex items-center justify-between gap-3"
          aria-label="Tests pagination"
        >
          <Link
            className={`inline-flex min-h-11 items-center justify-center rounded-prep-control border border-prep-orange bg-white px-4 font-bold text-prep-orange-dark ${page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-prep-orange-wash"}`}
            aria-disabled={page <= 1}
            tabIndex={page <= 1 ? -1 : undefined}
            href={page <= 1 ? pageHref(1) : pageHref(page - 1)}
          >
            ← Previous
          </Link>
          <span>
            Page {page} of {result.totalPages}
          </span>
          <Link
            className={`inline-flex min-h-11 items-center justify-center rounded-prep-control border border-prep-orange bg-white px-4 font-bold text-prep-orange-dark ${page >= result.totalPages ? "pointer-events-none opacity-50" : "hover:bg-prep-orange-wash"}`}
            aria-disabled={page >= result.totalPages}
            tabIndex={page >= result.totalPages ? -1 : undefined}
            href={
              page >= result.totalPages
                ? pageHref(result.totalPages)
                : pageHref(page + 1)
            }
          >
            Next →
          </Link>
        </nav>
      )}
    </WorkspaceShell>
  );
}
