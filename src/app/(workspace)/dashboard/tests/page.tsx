import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentTests } from "@/features/student-tests/service";

export const metadata = { title: "My tests" };
export default async function Page() {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const tests = await getStudentTests(auth.user.id);
  return <WorkspaceShell admin={false} name={auth.user.name} section="tests">
    <header className="page-heading"><span className="eyebrow">MY TESTS</span><h1>Practice at your pace</h1><p>Start a prepared paper or continue your active attempt. Your timer and answers are saved by the server.</p></header>
    {tests.length ? <div className="student-test-grid">{tests.map(test => {
      const exhausted = test.attemptsUsed >= test.maxAttempts && !test.activeAttemptId;
      return <article className="panel student-test-card" key={test.id}><div><span className="eyebrow">{test.examName}</span><h2>{test.title}</h2><p>{test.durationMinutes} minutes · {test.questionCount} questions</p></div><div className="student-test-meta"><span>{test.attemptsUsed}/{test.maxAttempts} attempts used</span>{test.activeAttemptId && <span className="status-pill pending">In progress</span>}</div>{exhausted ? <span className="quiet-tag">Attempt limit reached</span> : <Link className="button" href={`/tests/${test.id}`}>{test.activeAttemptId ? "Resume test" : "View instructions"}</Link>}</article>;
    })}</div> : <section className="panel empty-state"><div className="empty-symbol" aria-hidden="true">▣</div><span className="eyebrow">NO TESTS YET</span><h2>Your available tests will appear here</h2><p>Free tests and tests included in your active purchases are shown automatically.</p><Link className="button secondary" href="/free-tests">Explore free tests</Link></section>}
  </WorkspaceShell>;
}
