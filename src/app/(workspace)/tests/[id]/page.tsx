import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentTest } from "@/features/student-tests/service";
import { AppError } from "@/lib/errors/app-error";
import { StartAttemptButton } from "@/features/student-tests/ui/start-button";

export const metadata = { title: "Test instructions" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  let test;
  try { test = await getStudentTest((await params).id, auth.user.id); }
  catch (error) { if (error instanceof AppError && error.status === 404) notFound(); throw error; }
  const exhausted = test.attemptsUsed >= test.maxAttempts && !test.activeAttemptId;
  return <WorkspaceShell admin={false} name={auth.user.name} section="tests">
    <Link className="back-link" href="/dashboard/tests">← My tests</Link>
    <header className="page-heading test-intro"><span className="eyebrow">{test.examName}</span><h1>{test.title}</h1><p>{test.durationMinutes} minutes · {test.questionCount} questions · Attempt {Math.min(test.attemptsUsed + (test.activeAttemptId ? 0 : 1), test.maxAttempts)} of {test.maxAttempts}</p></header>
    {!test.hasAccess ? <section className="panel empty-state"><h2>Access required</h2><p>This paper is not included in your active access. Choose a package containing this test to continue.</p><Link className="button" href="/packages">View packages</Link></section> : <div className="test-instruction-grid"><section className="panel"><span className="eyebrow">BEFORE YOU BEGIN</span><h2>Test instructions</h2><div className="instruction-copy">{test.instructions ? test.instructions.split("\n").map((line, index) => <p key={index}>{line}</p>) : <p>Read each question carefully and submit before the timer reaches zero.</p>}</div><ul className="instruction-list"><li>The timer starts only when you press Start test.</li><li>Your deadline is controlled by the server and continues after refresh or reconnect.</li><li>Answers are saved as you move through the paper.</li><li>You can mark questions for review and return before submission.</li><li>The attempt submits automatically when time ends.</li></ul></section><aside className="panel start-panel"><span className="eyebrow">READY?</span><strong>{test.durationMinutes}:00</strong><p>Use a stable internet connection. Keep only this test open while answering.</p>{exhausted ? <div className="notice danger">You have used all available attempts.</div> : <StartAttemptButton testId={test.id} activeAttemptId={test.activeAttemptId} />}</aside></div>}
  </WorkspaceShell>;
}
