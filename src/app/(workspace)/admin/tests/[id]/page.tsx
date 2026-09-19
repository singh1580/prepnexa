import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { getManagedTest, getTestExams } from "@/features/admin-tests/service";
import { TestBuilder } from "@/features/admin-tests/ui/forms";
import { testIdSchema } from "@/features/admin-tests/validation";
import { requireAnyWorkspacePermission } from "@/features/auth/page-access";
import { AppError } from "@/lib/errors/app-error";

const access = [CONTENT_PERMISSIONS.manageTests, CONTENT_PERMISSIONS.manageSchedules];
export const metadata = { title: "Edit test" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAnyWorkspacePermission(access); const parsed = testIdSchema.safeParse((await params).id); if (!parsed.success) notFound();
  let test: Awaited<ReturnType<typeof getManagedTest>>; try { test = await getManagedTest(parsed.data); } catch (error) { if (error instanceof AppError && error.code === "TEST_CONTENT_NOT_FOUND") notFound(); throw error; }
  const canManage = auth.permissions.includes(CONTENT_PERMISSIONS.manageTests); const exams = test.status === "DRAFT" && canManage ? await getTestExams() : [];
  const assigned = new Set(test.sections.flatMap((section) => section.questions.map((question) => question.questionId)));
  return <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="tests"><Link className="back-link" href="/admin/tests">← All tests</Link><header className="page-heading split-heading"><div><span className="eyebrow">{test.examName} · {test.mode}</span><h1>{test.title}</h1><p>{test.durationMinutes} minutes · {test.maxAttempts} maximum attempt{test.maxAttempts === 1 ? "" : "s"}</p></div><span className={`status-pill content-${test.status.toLowerCase()}`}>{test.status}</span></header><TestBuilder test={{ id: test.id, examId: test.examId, title: test.title, mode: test.mode, durationMinutes: test.durationMinutes, instructions: test.instructions, maxAttempts: test.maxAttempts, shuffleQuestions: test.shuffleQuestions, shuffleOptions: test.shuffleOptions, status: test.status }} exams={exams} sections={test.sections.map((section) => ({ id: section.id, title: section.title, durationMinutes: section.durationMinutes, sortOrder: section.sortOrder, questions: section.questions.map((question) => ({ questionId: question.questionId, stem: question.stem, type: question.type, sortOrder: question.sortOrder })) }))} questions={test.availableQuestions.filter((question) => !assigned.has(question.id))} canManage={canManage} /></WorkspaceShell>;
}
