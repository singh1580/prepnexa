import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { getManagedQuestion, getQuestionTopics } from "@/features/admin-content/service";
import { QuestionForm, QuestionWorkflowActions } from "@/features/admin-content/ui/question-forms";
import { entityIdSchema } from "@/features/admin-content/validation";
import { requireAnyWorkspacePermission } from "@/features/auth/page-access";
import { AppError } from "@/lib/errors/app-error";

const access = [CONTENT_PERMISSIONS.createQuestions, CONTENT_PERMISSIONS.reviewQuestions, CONTENT_PERMISSIONS.publishQuestions];
export const metadata = { title: "Question workflow" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAnyWorkspacePermission(access);
  const parsed = entityIdSchema.safeParse((await params).id); if (!parsed.success) notFound();
  let question: Awaited<ReturnType<typeof getManagedQuestion>>;
  try { question = await getManagedQuestion(parsed.data); }
  catch (error) { if (error instanceof AppError && error.code === "CONTENT_NOT_FOUND") notFound(); throw error; }
  const canEdit = question.status === "DRAFT" && auth.permissions.includes(CONTENT_PERMISSIONS.createQuestions);
  const topics = canEdit ? await getQuestionTopics() : [];
  const answerConfig = question.revision?.answerConfig ?? {};
  return <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="questions">
    <Link className="back-link" href="/admin/questions">← Question bank</Link>
    <header className="page-heading split-heading"><div><span className="eyebrow">{question.examName} · {question.subjectName} · {question.topicName}</span><h1>Question workflow</h1><p>Revision {question.revision?.version ?? 1} · {question.type.replaceAll("_", " ")} · {question.difficulty}</p></div><span className={`status-pill content-${question.status.toLowerCase()}`}>{question.status.replace("_", " ")}</span></header>
    <div className="admin-two-column detail-columns"><div>{canEdit ? <QuestionForm topics={topics} question={{ id: question.id, topicId: question.topicId, type: question.type, stem: question.stem, explanation: question.explanation, marks: question.marks, negativeMarks: question.negativeMarks, difficulty: question.difficulty, options: question.options, answerConfig }} /> : <section className="panel question-preview"><span className="eyebrow">QUESTION</span><h2>{question.stem}</h2>{question.options.length > 0 && <ol>{question.options.map((option) => <li className={option.isCorrect ? "correct-answer" : ""} key={option.stableKey}><strong>{option.stableKey}</strong>{option.body}{option.isCorrect && <span>Correct</span>}</li>)}</ol>}{question.type === "NUMERIC" && <p><strong>Accepted:</strong> {String(answerConfig.value)} ± {String(answerConfig.tolerance ?? 0)}</p>}{question.type === "TEXT" && <p><strong>Accepted:</strong> {Array.isArray(answerConfig.acceptedAnswers) ? answerConfig.acceptedAnswers.join(", ") : "—"}</p>}{question.explanation && <div className="explanation"><span className="eyebrow">EXPLANATION</span><p>{question.explanation}</p></div>}</section>}</div><aside className="aside-stack"><QuestionWorkflowActions questionId={question.id} status={question.status} createdBy={question.createdBy} reviewedBy={question.reviewedBy} actorUserId={auth.user.id} permissions={auth.permissions} /><section className="panel"><span className="eyebrow">REVISION</span><h2>Version {question.revision?.version ?? 1}</h2><p className="muted">Created {question.createdAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}. Published questions are locked; returning a question to draft enables a new revision.</p></section></aside></div>
  </WorkspaceShell>;
}
