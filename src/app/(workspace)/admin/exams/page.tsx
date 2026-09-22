import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { getManagedExams } from "@/features/admin-content/service";
import { ExamCreateForm } from "@/features/admin-content/ui/forms";
import { requireWorkspacePermission } from "@/features/auth/page-access";

export const metadata = { title: "Manage exams" };
export default async function Page() {
  const auth = await requireWorkspacePermission(CONTENT_PERMISSIONS.manageExams);
  const exams = await getManagedExams();
  return <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="exams">
    <header className="page-heading split-heading"><div><span className="eyebrow">EXAM TAXONOMY</span><h1>Exams</h1><p>Draft first. Structure carefully. Publish only through the approved workflow.</p></div><span className="quiet-tag">{exams.length} total</span></header>
    <div className="admin-two-column"><section><div className="section-heading"><div><span className="eyebrow">ALL EXAMS</span><h2>Current structure</h2></div></div>{exams.length ? <div className="managed-list">{exams.map((exam) => <Link href={`/admin/exams/${exam.id}`} className="managed-card" key={exam.id}><div><span className={`status-pill content-${exam.status.toLowerCase()}`}>{exam.status.replace("_", " ")}</span><h2>{exam.name}</h2><p>/{exam.slug}</p></div><dl><div><dt>Subjects</dt><dd>{exam.subjectCount}</dd></div><div><dt>Topics</dt><dd>{exam.topicCount}</dd></div></dl><b aria-hidden="true">→</b></Link>)}</div> : <div className="panel empty-state compact-empty"><h2>No exams yet</h2><p>Create the first draft using the form.</p></div>}</section><aside className="panel sticky-panel"><span className="eyebrow">NEW DRAFT</span><h2>Create an exam</h2><p className="muted">It will remain private until the later review and publish step.</p><ExamCreateForm /></aside></div>
  </WorkspaceShell>;
}
