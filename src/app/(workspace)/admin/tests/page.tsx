import Link from "next/link";
import { z } from "zod";
import { WorkspaceShell } from "@/components/workspace-shell";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { testCategoryLabel } from "@/features/admin-tests/categories";
import { getManagedTests, getTestExams, getTestFilterTaxonomy } from "@/features/admin-tests/service";
import { TestCreateForm } from "@/features/admin-tests/ui/forms";
import { TestListFilters } from "@/features/admin-tests/ui/test-list-filters";
import { requireAnyWorkspacePermission } from "@/features/auth/page-access";

const access = [CONTENT_PERMISSIONS.manageTests, CONTENT_PERMISSIONS.manageSchedules];
const statuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const categories = ["FULL_MOCK", "SUBJECT_TEST", "TOPIC_SET", "UNCLASSIFIED"] as const;
const id = z.uuid();
const pageSize = 20;
type Params = { exam?: string | string[]; subject?: string | string[]; topic?: string | string[]; q?: string | string[]; category?: string | string[]; status?: string | string[]; page?: string | string[] };

function textParam(value: string | string[] | undefined, max = 160) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function idParam(value: string | string[] | undefined) { const parsed = id.safeParse(typeof value === "string" ? value : ""); return parsed.success ? parsed.data : ""; }
function enumParam<const T extends readonly string[]>(value: string | string[] | undefined, allowed: T): T[number] | "" { return typeof value === "string" && allowed.includes(value) ? value as T[number] : ""; }

export const metadata = { title: "Test builder" };
export default async function Page({ searchParams }: { searchParams: Promise<Params> }) {
  const filters = await searchParams;
  const selectedExamId = idParam(filters.exam), selectedSubjectId = idParam(filters.subject), selectedTopicId = idParam(filters.topic);
  const category = enumParam(filters.category, categories), status = enumParam(filters.status, statuses), query = textParam(filters.q);
  const requestedPage = Math.max(1, Math.min(10_000, Number.parseInt(textParam(filters.page, 5), 10) || 1));
  const auth = await requireAnyWorkspacePermission(access);
  const canManage = auth.permissions.includes(CONTENT_PERMISSIONS.manageTests);
  const [result, exams, taxonomy] = await Promise.all([
    getManagedTests({ examId: selectedExamId || undefined, subjectId: selectedSubjectId || undefined, topicId: selectedTopicId || undefined, query: query || undefined, category: category || undefined, status: status || undefined, page: requestedPage, pageSize }),
    canManage ? getTestExams() : Promise.resolve([]),
    getTestFilterTaxonomy(),
  ]);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ exam: selectedExamId, subject: selectedSubjectId, topic: selectedTopicId, category, status, q: query })) if (value) params.set(key, value);
  const pageHref = (page: number) => { const next = new URLSearchParams(params); if (page > 1) next.set("page", String(page)); return `/admin/tests${next.size ? `?${next}` : ""}`; };
  const first = result.items.length ? (requestedPage - 1) * pageSize + 1 : 0;
  const last = result.items.length ? Math.min(requestedPage * pageSize, result.total) : 0;

  return <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="tests">
    <header className="page-heading"><span className="eyebrow">TEST BUILDER</span><h1>{exams.find(exam => exam.id === selectedExamId)?.name ?? "All exams"} · Tests & practice sets</h1><p>Prepare questions, set a time limit and publish your mock test.</p></header>
    <TestListFilters exams={exams} subjects={taxonomy.subjects} topics={taxonomy.topics} initial={{ exam: selectedExamId, subject: selectedSubjectId, topic: selectedTopicId, category, status, query }} />
    <p className="muted">Showing {first}–{last} of {result.total} matching test{result.total === 1 ? "" : "s"}</p>
    <div className="admin-two-column"><section>
      {result.items.length ? <div className="managed-list">{result.items.map(test => <Link className="managed-card" href={`/admin/tests/${test.id}`} key={test.id}><div><span className="eyebrow">{test.examName} · {testCategoryLabel(test.category)}</span><h2>{test.title}</h2><p>{test.durationMinutes} minutes</p></div><dl><div><dt>Sections</dt><dd>{test.sectionCount}</dd></div><div><dt>Questions</dt><dd>{test.questionCount}</dd></div></dl><span className={`status-pill content-${test.status.toLowerCase()}`}>{test.status}</span></Link>)}</div> : <div className="panel empty-state"><h2>No matching tests</h2><p>{requestedPage > 1 ? "This page is empty. Go to the previous page or change the filters." : "Change the filters or create a draft test from the builder panel."}</p></div>}
      {result.totalPages > 1 && <nav className="form-actions" aria-label="Test list pages">{requestedPage > 1 && <Link className="button secondary" href={pageHref(requestedPage - 1)}>← Previous</Link>}<span className="muted">Page {requestedPage} of {result.totalPages}</span>{requestedPage < result.totalPages && <Link className="button secondary" href={pageHref(requestedPage + 1)}>Next →</Link>}</nav>}
    </section>{canManage && <aside className="panel sticky-panel"><span className="eyebrow">NEW TEST</span><h2>Create a draft</h2>{exams.length ? <TestCreateForm exams={exams} selectedExamId={selectedExamId} /> : <p className="notice">Create an exam before building a test.</p>}</aside>}</div>
  </WorkspaceShell>;
}
