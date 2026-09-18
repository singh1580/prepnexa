import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { getManagedExam } from "@/features/admin-content/service";
import { ExamEditForm, SubjectCreateForm, SubjectEditor } from "@/features/admin-content/ui/forms";
import { entityIdSchema } from "@/features/admin-content/validation";
import { requireWorkspacePermission } from "@/features/auth/page-access";
import { AppError } from "@/lib/errors/app-error";

export const metadata = { title: "Edit exam" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireWorkspacePermission(CONTENT_PERMISSIONS.manageExams);
  const id = entityIdSchema.safeParse((await params).id);
  if (!id.success) notFound();
  let exam: Awaited<ReturnType<typeof getManagedExam>>;
  try { exam = await getManagedExam(id.data); }
  catch (error) { if (error instanceof AppError && error.code === "CONTENT_NOT_FOUND") notFound(); throw error; }
  return <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="exams">
    <Link className="back-link" href="/admin/exams">← All exams</Link>
    <header className="page-heading split-heading"><div><span className="eyebrow">EXAM STRUCTURE</span><h1>{exam.name}</h1><p>Organise subjects and topics before questions are authored.</p></div><span className={`status-pill content-${exam.status.toLowerCase()}`}>{exam.status.replace("_", " ")}</span></header>
    <div className="admin-two-column detail-columns"><section><div className="section-heading"><div><span className="eyebrow">SUBJECTS & TOPICS</span><h2>Curriculum map</h2></div></div>{exam.subjects.length ? <div className="taxonomy-list">{exam.subjects.map((subject) => <SubjectEditor key={subject.id} subject={{ id: subject.id, name: subject.name, sortOrder: subject.sortOrder, topics: subject.topics.map((topic) => ({ id: topic.id, name: topic.name, sortOrder: topic.sortOrder })) }} />)}</div> : <div className="panel empty-state compact-empty"><h2>No subjects yet</h2><p>Add the first subject from the structure panel.</p></div>}</section><aside className="aside-stack"><section className="panel"><span className="eyebrow">EXAM DETAILS</span><h2>Public metadata</h2><ExamEditForm exam={{ id: exam.id, name: exam.name, slug: exam.slug, description: exam.description }} /></section><section className="panel"><span className="eyebrow">ADD STRUCTURE</span><h2>New subject</h2><SubjectCreateForm examId={exam.id} nextOrder={exam.subjects.length} /></section></aside></div>
  </WorkspaceShell>;
}
