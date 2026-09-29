import Link from "next/link";
import { testCategoryLabel } from "@/features/admin-tests/categories";
import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { getManagedTest } from "@/features/admin-tests/service";
import { TestBuilder } from "@/features/admin-tests/ui/forms";
import { testIdSchema } from "@/features/admin-tests/validation";
import { requireAnyWorkspacePermission } from "@/features/auth/page-access";
import { AppError } from "@/lib/errors/app-error";

const access = [
  CONTENT_PERMISSIONS.manageTests,
  CONTENT_PERMISSIONS.manageSchedules,
];
export const metadata = { title: "Edit test" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireAnyWorkspacePermission(access);
  const parsed = testIdSchema.safeParse((await params).id);
  if (!parsed.success) notFound();
  let test: Awaited<ReturnType<typeof getManagedTest>>;
  try {
    test = await getManagedTest(parsed.data);
  } catch (error) {
    if (error instanceof AppError && error.code === "TEST_CONTENT_NOT_FOUND")
      notFound();
    throw error;
  }
  const canManage = auth.permissions.includes(CONTENT_PERMISSIONS.manageTests);
  const assigned = new Set(
    test.sections.flatMap((section) =>
      section.questions.map((question) => question.questionId),
    ),
  );
  return (
    <WorkspaceShell
      admin
      name={auth.user.name}
      permissions={auth.permissions}
      section="tests"
    >
      <Link className="back-link" href="/admin/tests">
        ← All tests
      </Link>
      <header className="admin-page-header">
        <div>
          <span className="eyebrow">
            {test.mode === "PRACTICE" ? "Practice set" : "Mock test"} · {testCategoryLabel(test.category)}
          </span>
          <h1>{test.title}</h1>
          <p>
            {test.durationMinutes} minutes · {test.maxAttempts} maximum attempt
            {test.maxAttempts === 1 ? "" : "s"}
          </p>
        </div>
      </header>
      <TestBuilder
        test={{
          category: test.category,
          id: test.id,
          title: test.title,
          mode: test.mode === "PRACTICE" ? "PRACTICE" : "MOCK",
          durationMinutes: test.durationMinutes,
          instructions: test.instructions,
          maxAttempts: test.maxAttempts,
          shuffleQuestions: test.shuffleQuestions,
          shuffleOptions: test.shuffleOptions,
        }}
        sections={test.sections.map((section) => ({
          id: section.id,
          title: section.title,
          durationMinutes: section.durationMinutes,
          sortOrder: section.sortOrder,
          questions: section.questions.map((question) => ({
            questionId: question.questionId,
            stem: question.stem,
            type: question.type,
            sortOrder: question.sortOrder,
            explanation: question.explanation,
            marks: question.marks,
            negativeMarks: question.negativeMarks,
            options: question.options,
            answerConfig: question.answerConfig,
          })),
        }))}
        questions={test.availableQuestions.filter(
          (question) => !assigned.has(question.id),
        )}
        canManage={canManage}
        canCreate={auth.permissions.includes(
          CONTENT_PERMISSIONS.createQuestions,
        )}
      />
    </WorkspaceShell>
  );
}
