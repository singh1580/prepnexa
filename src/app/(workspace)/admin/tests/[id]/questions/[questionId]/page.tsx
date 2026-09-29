import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspacePermission } from "@/features/auth/page-access";
import { findManagedTest } from "@/features/admin-tests/repository";
import { getManagedQuestion } from "@/features/admin-content/service";
import { QuestionForm } from "@/features/admin-content/ui/question-forms";
import { testIdSchema } from "@/features/admin-tests/validation";

export const metadata = { title: "Edit test question" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string; questionId: string }>;
}) {
  const auth = await requireWorkspacePermission("test.manage");
  if (!auth.permissions.includes("question.create")) redirect("/access-denied");
  const values = await params;
  const id = testIdSchema.safeParse(values.id),
    questionId = testIdSchema.safeParse(values.questionId);
  if (!id.success || !questionId.success) notFound();
  const test = await findManagedTest(id.data);
  if (!test) notFound();
  const section = test.sections.find((item) =>
    item.questions.some((question) => question.questionId === questionId.data),
  );
  if (!section) notFound();
  const returnTo = `/admin/tests/${test.id}`;
  const question = await getManagedQuestion(questionId.data);
  return (
    <WorkspaceShell
      admin
      name={auth.user.name}
      permissions={auth.permissions}
      section="tests"
    >
      <Link className="back-link" href={returnTo}>
        ← Back to {test.title}
      </Link>
      <header className="page-heading">
        <span className="eyebrow">
          {test.mode === "PRACTICE" ? "Practice set" : "Mock test"} · {section.title}
        </span>
        <h1>Edit question in this test</h1>
        <p>
          Your changes apply to this paper. Other tests using the original
          question keep their existing content.
        </p>
      </header>
      {question ? (
        <QuestionForm
          sectionId={section.id}
          returnTo={returnTo}
          question={{
            id: question.id,
            topicId: question.topicId,
            type: question.type,
            stem: question.stem,
            imageUrl: question.imageUrl,
            explanation: question.explanation,
            marks: question.marks,
            negativeMarks: question.negativeMarks,
            difficulty: question.difficulty,
            options: question.options,
            answerConfig: question.revision?.answerConfig ?? {},
          }}
        />
      ) : null}
    </WorkspaceShell>
  );
}
