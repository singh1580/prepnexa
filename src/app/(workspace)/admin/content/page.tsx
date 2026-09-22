import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { ADMIN_CONTENT_PERMISSION_KEYS, CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { getManagedExams, getManagedQuestions } from "@/features/admin-content/service";
import { requireAnyWorkspacePermission } from "@/features/auth/page-access";

export const metadata = { title: "Content workspace" };
export default async function Page() {
  const auth = await requireAnyWorkspacePermission(ADMIN_CONTENT_PERMISSION_KEYS);
  const canManageExams = auth.permissions.includes(CONTENT_PERMISSIONS.manageExams);
  const canUseQuestions = [CONTENT_PERMISSIONS.createQuestions, CONTENT_PERMISSIONS.reviewQuestions, CONTENT_PERMISSIONS.publishQuestions].some((permission) => auth.permissions.includes(permission));
  const [exams, questions] = await Promise.all([canManageExams ? getManagedExams() : Promise.resolve([]), canUseQuestions ? getManagedQuestions() : Promise.resolve([])]);
  const subjects = exams.reduce((total, exam) => total + exam.subjectCount, 0);
  const topics = exams.reduce((total, exam) => total + exam.topicCount, 0);
  return <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="content">
    <header className="page-heading"><span className="eyebrow">CONTENT OPERATIONS</span><h1>Manage your content</h1><p>Start with an exam, build a test, then choose whether to offer it individually or in a bundle.</p></header>
    <div className="metric-grid"><article className="metric-card"><span>Exams</span><strong>{exams.length}</strong><small>all content states</small></article><article className="metric-card"><span>Topics</span><strong>{topics}</strong><small>ready for questions</small></article><article className="metric-card"><span>Questions</span><strong>{questions.length}</strong><small>across the workflow</small></article></div>
    <div className="content-callouts">{canManageExams && <section className="panel admin-callout"><div><span className="eyebrow">TAXONOMY</span><h2>Exam structure</h2><p>{subjects} subjects organised across the catalogue.</p></div><Link className="button secondary" href="/admin/exams">Manage exams</Link></section>}{canUseQuestions && <section className="panel admin-callout"><div><span className="eyebrow">QUESTION BANK</span><h2>Reusable questions (optional)</h2><p>Keep reusable questions here. For a new paper, create or import questions inside its test builder.</p></div><Link className="button" href="/admin/questions">Open questions</Link></section>}</div>
    {!canManageExams && !canUseQuestions && <section className="panel empty-state"><h2>No content tools are assigned</h2><p>Your administrator role is valid, but it does not include content permissions.</p></section>}
    <section className="phase-roadmap"><article><span>01</span><h2>Choose exam</h2><p>Available now</p></article><article><span>02</span><h2>Create test</h2><p>Available now</p></article><article><span>03</span><h2>Add & preview questions</h2><p>Available now</p></article><article><span>04</span><h2>Publish & package</h2><p>Available now</p></article></section>
  </WorkspaceShell>;
}
