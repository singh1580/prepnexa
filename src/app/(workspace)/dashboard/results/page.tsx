import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentResults } from "@/features/student-results/service";

export const metadata = { title: "Results" };
export default async function Page() {
  const auth = await requireWorkspace(); if (auth.admin) redirect("/admin");
  const results = await getStudentResults(auth.user.id);
  return <WorkspaceShell admin={false} name={auth.user.name} section="results">
    <header className="page-heading"><span className="eyebrow">RESULTS</span><h1>Track every attempt</h1><p>Review scores, accuracy, topic performance and complete answer explanations.</p></header>
    {results.length ? <div className="result-list">{results.map(result => { const total = result.correctCount + result.incorrectCount + result.unansweredCount; const accuracy = result.correctCount + result.incorrectCount ? Math.round(result.correctCount / (result.correctCount + result.incorrectCount) * 100) : 0; return <article className="panel result-card" key={result.id}><div><span className="eyebrow">{result.examName}</span><h2>{result.title}</h2><p>Attempt {result.sequence} · {new Date(result.publishedAt).toLocaleDateString("en-IN")}</p></div><div className="result-score"><strong>{result.score}</strong><span>/ {result.maxScore}</span></div><div className="result-mini"><span>{accuracy}% accuracy</span><span>{result.correctCount}/{total} correct</span></div><Link className="button" href={`/results/${result.id}`}>Review result</Link></article>; })}</div> : <section className="panel empty-state"><div className="empty-symbol" aria-hidden="true">✓</div><h2>No results yet</h2><p>Complete a mock test and its result will appear here automatically.</p><Link className="button" href="/dashboard/tests">Open my tests</Link></section>}
  </WorkspaceShell>;
}
