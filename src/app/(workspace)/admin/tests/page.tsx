import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { getManagedTests, getTestExams } from "@/features/admin-tests/service";
import { TestCreateForm } from "@/features/admin-tests/ui/forms";
import { requireAnyWorkspacePermission } from "@/features/auth/page-access";

const access = [CONTENT_PERMISSIONS.manageTests, CONTENT_PERMISSIONS.manageSchedules];
export const metadata = { title: "Test builder" };
export default async function Page() {
  const auth = await requireAnyWorkspacePermission(access); const canManage = auth.permissions.includes(CONTENT_PERMISSIONS.manageTests);
  const [tests, exams] = await Promise.all([getManagedTests(), canManage ? getTestExams() : Promise.resolve([])]);
  return <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="tests"><header className="page-heading"><span className="eyebrow">TEST BUILDER</span><h1>Design the paper, not the attempt</h1><p>Configure sections, published questions and live windows. Student execution begins in Phase 6.</p></header><div className="admin-two-column"><section>{tests.length ? <div className="managed-list">{tests.map((test) => <Link className="managed-card" href={`/admin/tests/${test.id}`} key={test.id}><div><span className="eyebrow">{test.examName} · {test.mode}</span><h2>{test.title}</h2><p>{test.durationMinutes} minutes</p></div><dl><div><dt>Sections</dt><dd>{test.sectionCount}</dd></div><div><dt>Questions</dt><dd>{test.questionCount}</dd></div></dl><span className={`status-pill content-${test.status.toLowerCase()}`}>{test.status}</span></Link>)}</div> : <div className="panel empty-state"><h2>No tests configured</h2><p>Create a draft test from the builder panel.</p></div>}</section>{canManage && <aside className="panel sticky-panel"><span className="eyebrow">NEW TEST</span><h2>Create a draft</h2>{exams.length ? <TestCreateForm exams={exams} /> : <p className="notice">Create an exam before building a test.</p>}</aside>}</div></WorkspaceShell>;
}
