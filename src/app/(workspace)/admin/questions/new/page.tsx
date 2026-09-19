import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { getQuestionTopics } from "@/features/admin-content/service";
import { QuestionForm } from "@/features/admin-content/ui/question-forms";
import { requireWorkspacePermission } from "@/features/auth/page-access";

export const metadata = { title: "Create question" };
export default async function Page() {
  const auth = await requireWorkspacePermission(CONTENT_PERMISSIONS.createQuestions);
  const topics = await getQuestionTopics();
  return <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="questions">
    <Link className="back-link" href="/admin/questions">← Question bank</Link>
    <header className="page-heading"><span className="eyebrow">NEW DRAFT</span><h1>Create a question</h1><p>The first save creates revision 1. It remains private until reviewed and published.</p></header>
    {topics.length ? <QuestionForm topics={topics} /> : <section className="panel empty-state"><h2>Add an exam topic first</h2><p>Questions must belong to a topic in the exam taxonomy.</p><Link className="button" href="/admin/exams">Manage exams</Link></section>}
  </WorkspaceShell>;
}
