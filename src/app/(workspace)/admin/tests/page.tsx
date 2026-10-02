import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { AdminModal } from "@/components/admin-modal";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { testCategoryLabel } from "@/features/admin-tests/categories";
import { getManagedTests } from "@/features/admin-tests/service";
import { TestCreateForm } from "@/features/admin-tests/ui/forms";
import { TestListFilters } from "@/features/admin-tests/ui/test-list-filters";
import { requireAnyWorkspacePermission } from "@/features/auth/page-access";

const access = [CONTENT_PERMISSIONS.manageTests, CONTENT_PERMISSIONS.manageSchedules];
const pageSize = 20;
type Params = { q?: string | string[]; category?: string | string[]; mode?: string | string[]; page?: string | string[] };
function text(value: string | string[] | undefined, max = 160) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
export const metadata = { title: "Tests & practice sets" };

export default async function Page({ searchParams }: { searchParams: Promise<Params> }) {
  const filters = await searchParams;
  const query = text(filters.q);
  const category = text(filters.category) as "FULL_MOCK" | "SUBJECT_TEST" | "TOPIC_SET" | "UNCLASSIFIED" | "";
  const mode = text(filters.mode) as "MOCK" | "PRACTICE" | "";
  const page = Math.max(1, Number.parseInt(text(filters.page, 5), 10) || 1);
  const auth = await requireAnyWorkspacePermission(access);
  const canManage = auth.permissions.includes(CONTENT_PERMISSIONS.manageTests);
  const result = await getManagedTests({ query: query || undefined, category: category || undefined, mode: mode || undefined, page, pageSize });
  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);
    if (mode) params.set("mode", mode);
    params.set("page", String(target));
    return `/admin/tests?${params.toString()}`;
  };
  return (
    <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="tests">
      <header className="admin-page-header reference-admin-heading"><div><h1>Tests &amp; Practice Sets</h1><p>Create and manage tests and practice sets.</p></div>{canManage && <AdminModal label="＋ New test" title="Create test or practice set" description="Complete the test settings, then add sections and questions in the same test workspace." large><TestCreateForm /></AdminModal>}</header>
      <TestListFilters initial={{ query, category, mode }} />
      {result.items.length ? <div className="reference-test-table"><table><thead><tr><th>Test Name</th><th>Mode</th><th>Sections</th><th>Questions</th><th>Duration</th><th>Attempts</th><th>Actions</th></tr></thead><tbody>{result.items.map(test=><tr key={test.id}><td><strong>{test.title}</strong><small>{testCategoryLabel(test.category)}</small></td><td>{test.mode==="PRACTICE"?"Practice Set":"Mock Test"}</td><td>{test.sectionCount}</td><td>{test.questionCount}</td><td>{test.durationMinutes} min</td><td>{test.attemptCount}</td><td><div><Link className="table-edit" href={`/admin/tests/${test.id}#settings`}>Edit</Link><Link className="table-open" href={`/admin/tests/${test.id}`}>Open</Link></div></td></tr>)}</tbody></table></div> : <div className="admin-card clean-empty tall"><span className="empty-icon">▣</span><strong>No tests or practice sets</strong><span>Create your first item or change the active filters.</span></div>}
      {result.totalPages > 1 && <nav className="admin-pagination" aria-label="Tests pagination"><Link className={`button secondary ${page <= 1 ? "disabled" : ""}`} aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined} href={page <= 1 ? pageHref(1) : pageHref(page - 1)}>← Previous</Link><span>Page {page} of {result.totalPages}</span><Link className={`button secondary ${page >= result.totalPages ? "disabled" : ""}`} aria-disabled={page >= result.totalPages} tabIndex={page >= result.totalPages ? -1 : undefined} href={page >= result.totalPages ? pageHref(result.totalPages) : pageHref(page + 1)}>Next →</Link></nav>}
    </WorkspaceShell>
  );
}
