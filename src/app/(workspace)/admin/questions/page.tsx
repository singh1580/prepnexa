import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { getManagedQuestions } from "@/features/admin-content/service";
import { requireAnyWorkspacePermission } from "@/features/auth/page-access";

const access = [CONTENT_PERMISSIONS.createQuestions, CONTENT_PERMISSIONS.reviewQuestions, CONTENT_PERMISSIONS.publishQuestions];
export const metadata = { title: "Question bank" };
export default async function Page() {
  const auth = await requireAnyWorkspacePermission(access);
  const questions = await getManagedQuestions();
  const canCreate = auth.permissions.includes(CONTENT_PERMISSIONS.createQuestions);
  return <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="questions">
    <header className="page-heading split-heading"><div><span className="eyebrow">QUESTION BANK</span><h1>Question bank</h1><p>Create questions, check the answers and publish when ready.</p></div>{canCreate && <Link className="button" href="/admin/questions/new">Create question</Link>}</header>
    <div className="question-summary"><span><strong>{questions.length}</strong> total</span><span><strong>{questions.filter((question) => question.status === "DRAFT").length}</strong> drafts</span><span><strong>{questions.filter((question) => question.status === "IN_REVIEW").length}</strong> pending publication</span><span><strong>{questions.filter((question) => question.status === "PUBLISHED").length}</strong> published</span></div>
    {questions.length ? <div className="managed-list">{questions.map((question) => <Link className="managed-card question-card" href={`/admin/questions/${question.id}`} key={question.id}><div><span className="eyebrow">{question.examName} · {question.subjectName} · {question.topicName}</span><h2>{question.stem}</h2><p>{question.type.replaceAll("_", " ")} · {question.difficulty}</p></div><span className={`status-pill content-${question.status.toLowerCase()}`}>{question.status.replace("_", " ")}</span><b aria-hidden="true">→</b></Link>)}</div> : <section className="panel empty-state"><h2>No questions yet</h2><p>Create the first draft after adding at least one exam topic.</p>{canCreate && <Link className="button" href="/admin/questions/new">Create first question</Link>}</section>}
  </WorkspaceShell>;
}
