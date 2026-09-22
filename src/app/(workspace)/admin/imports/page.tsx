import { WorkspaceShell } from "@/components/workspace-shell";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { getQuestionTopics } from "@/features/admin-content/service";
import { questionCsvTemplate } from "@/features/admin-imports/question-csv";
import { QuestionImportForm } from "@/features/admin-imports/ui/import-form";
import { requireWorkspacePermission } from "@/features/auth/page-access";

export const metadata = { title: "Bulk question import" };
export default async function Page() {
  const auth = await requireWorkspacePermission(CONTENT_PERMISSIONS.createQuestions); const topics = await getQuestionTopics();
  return <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="imports"><header className="page-heading"><span className="eyebrow">BULK OPERATIONS</span><h1>Import without partial data</h1><p>Every row is validated first. Invalid files create an error report; valid files create audited draft questions atomically.</p></header><div className="admin-two-column detail-columns"><QuestionImportForm template={questionCsvTemplate(topics[0]?.id)} /><aside className="panel topic-reference"><span className="eyebrow">TOPIC REFERENCE</span><h2>Use these topic IDs</h2>{topics.length ? topics.map((topic) => <article key={topic.id}><strong>{topic.examName} · {topic.subjectName}</strong><span>{topic.topicName}</span><code>{topic.id}</code></article>) : <p className="notice">Add exam topics before importing questions.</p>}</aside></div></WorkspaceShell>;
}
