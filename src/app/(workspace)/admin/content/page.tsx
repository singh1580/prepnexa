import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { ADMIN_CONTENT_PERMISSION_KEYS, CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { getManagedExams } from "@/features/admin-content/service";
import { requireAnyWorkspacePermission } from "@/features/auth/page-access";

export const metadata = { title: "Content workspace" };
export default async function Page() {
  const auth = await requireAnyWorkspacePermission(ADMIN_CONTENT_PERMISSION_KEYS);
  const canManageExams = auth.permissions.includes(CONTENT_PERMISSIONS.manageExams);
  const exams = canManageExams ? await getManagedExams() : [];
  const subjects = exams.reduce((total, exam) => total + exam.subjectCount, 0);
  const topics = exams.reduce((total, exam) => total + exam.topicCount, 0);
  return <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="content">
    <header className="page-heading"><span className="eyebrow">CONTENT OPERATIONS</span><h1>Build with control</h1><p>Every tool shown here is backed by a server-side permission and an audit record.</p></header>
    {canManageExams ? <><div className="metric-grid"><article className="metric-card"><span>Exams</span><strong>{exams.length}</strong><small>all content states</small></article><article className="metric-card"><span>Subjects</span><strong>{subjects}</strong><small>structured by exam</small></article><article className="metric-card"><span>Topics</span><strong>{topics}</strong><small>ready for questions</small></article></div><section className="panel admin-callout"><div><span className="eyebrow">START HERE</span><h2>Exam taxonomy</h2><p>Create exams, then organise their subjects and topics. Draft records stay out of the public catalogue.</p></div><Link className="button" href="/admin/exams">Manage exams</Link></section></> : <section className="panel empty-state"><h2>No content tools are assigned</h2><p>Your administrator role is valid, but it does not include exam management.</p></section>}
    <section className="phase-roadmap"><article><span>01</span><h2>Taxonomy</h2><p>Available now</p></article><article className="muted-card"><span>02</span><h2>Question workflow</h2><p>Next Phase 5 slice</p></article><article className="muted-card"><span>03</span><h2>Tests & imports</h2><p>Later in Phase 5</p></article></section>
  </WorkspaceShell>;
}
