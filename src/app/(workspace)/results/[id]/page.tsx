import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentResult } from "@/features/student-results/service";
import { AppError } from "@/lib/errors/app-error";
import { entityIdSchema } from "@/features/student-tests/validation";

type Breakdown = {
  title?: string;
  score: string;
  maxScore: string;
  correctCount: number;
  incorrectCount?: number;
  unansweredCount?: number;
  timeSpentSeconds?: number;
};
type ReviewQuestion = {
  id: string;
  position: number;
  stem: string;
  explanation: string | null;
  type: string;
  marks: string;
  negativeMarks: string;
  selectedOptionIds: string[] | null;
  textAnswer: string | null;
  numericAnswer: string | null;
  isCorrect: boolean;
  awardedMarks: string;
  timeSpentSeconds: number;
  answerConfig: Record<string, unknown>;
  sectionTitle: string;
  options: {
    id: string;
    body: string;
    isCorrect: boolean;
    selected: boolean;
  }[];
};
type ResultView = {
  title: string;
  examName: string;
  score: string;
  maxScore: string;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeSpentSeconds: number;
  sections: Breakdown[];
  questions: ReviewQuestion[];
  testId: string;
  maxAttempts: number;
  attemptsUsed: number;
};

export const metadata = { title: "Result review" };
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ course?: string }>;
}) {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const parsedId = entityIdSchema.safeParse((await params).id);
  if (!parsedId.success) notFound();
  let raw;
  try {
    raw = await getStudentResult(parsedId.data, auth.user.id);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  const result = raw as unknown as ResultView;
  const courseSlug = (await searchParams).course;
  const courseHref = courseSlug ? `/dashboard/courses/${encodeURIComponent(courseSlug)}?view=results` : "/dashboard/courses";
  const attempted = result.correctCount + result.incorrectCount,
    accuracy = attempted
      ? Math.round((result.correctCount / attempted) * 100)
      : 0;
  const sectionInsights = result.sections.map((item) => ({...item, percentage: Number(item.maxScore) ? Math.round(Number(item.score) / Number(item.maxScore) * 100) : 0}));
  const strengths = sectionInsights.filter((item) => item.percentage >= 70).sort((a,b)=>b.percentage-a.percentage);
  const needsWork = sectionInsights.filter((item) => item.percentage < 70).sort((a,b)=>a.percentage-b.percentage);
  return (
    <WorkspaceShell admin={false} name={auth.user.name} section="courses">
      <Link className="back-link" href={courseHref}>
        ← Course results
      </Link>
      <header className="page-heading">
        <span className="eyebrow">{result.examName}</span>
        <h1>{result.title}</h1>
        <p>Complete performance and answer review</p>
      </header>
      <section className="result-hero panel">
        <div>
          <span>YOUR SCORE</span>
          <strong>
            {result.score}
            <small> / {result.maxScore}</small>
          </strong>
        </div>
        <dl>
          <div>
            <dt>Accuracy</dt>
            <dd>{accuracy}%</dd>
          </div>
          <div>
            <dt>Correct</dt>
            <dd>{result.correctCount}</dd>
          </div>
          <div>
            <dt>Incorrect</dt>
            <dd>{result.incorrectCount}</dd>
          </div>
          <div>
            <dt>Unanswered</dt>
            <dd>{result.unansweredCount}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>
              {Math.floor(result.timeSpentSeconds / 60)}m{" "}
              {result.timeSpentSeconds % 60}s
            </dd>
          </div>
        </dl>
      </section>
      <div className="result-breakdowns">
        <section className="panel">
          <span className="eyebrow">SECTION PERFORMANCE</span>
          {result.sections.map((item) => (
            <div className="breakdown-row" key={item.title}>
              <div>
                <strong>{item.title}</strong>
                <span>
                  {item.correctCount} correct · {item.incorrectCount} incorrect
                  · {item.unansweredCount} unanswered
                  {typeof item.timeSpentSeconds === "number" ? ` · ${Math.floor(item.timeSpentSeconds / 60)}m ${item.timeSpentSeconds % 60}s` : ""}
                </span>
              </div>
              <b>
                {item.score} / {item.maxScore}
              </b>
              <span className="performance-bar"><i style={{width:`${Number(item.maxScore) ? Math.max(2, Number(item.score)/Number(item.maxScore)*100) : 0}%`}} /></span>
            </div>
          ))}
        </section>
        <aside className="insight-grid"><section className="panel insight-card strength"><span className="eyebrow">STRENGTHS</span><h2>Keep building on</h2>{strengths.length?strengths.map((item)=><div key={item.title}><strong>{item.title}</strong><span>{item.percentage}%</span></div>):<p className="muted">Score 70% or more in a section to add it here.</p>}</section><section className="panel insight-card needs-work"><span className="eyebrow">NEEDS WORK</span><h2>Focus next on</h2>{needsWork.length?needsWork.map((item)=><div key={item.title}><strong>{item.title}</strong><span>{item.percentage}%</span></div>):<p className="muted">No weak section detected in this attempt.</p>}</section></aside>
      </div>
      <section className="result-review">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ANSWER REVIEW</span>
            <h2>Question review</h2>
          </div>
        </div>
        {result.questions.map((question) => (
          <article
            className={`panel review-question ${question.isCorrect ? "correct" : question.selectedOptionIds?.length || question.textAnswer || question.numericAnswer ? "incorrect" : "unanswered"}`}
            key={question.id}
          >
            <div className="question-topline">
              <span>Question {question.position + 1} · {question.sectionTitle}</span>
              <strong>
                {question.awardedMarks} / {question.marks}
              </strong>
            </div>
            <p className="question-time">Time spent: {Math.floor(question.timeSpentSeconds / 60)}m {question.timeSpentSeconds % 60}s</p>
            <h3>{question.stem}</h3>
            {question.options.length > 0 && (
              <div className="review-options">
                {question.options.map((option) => (
                  <div
                    key={option.id}
                    className={`${option.isCorrect ? "correct-answer" : ""} ${option.selected ? "selected-answer" : ""}`}
                  >
                    <span>
                      {option.selected
                        ? "Your answer"
                        : option.isCorrect
                          ? "Correct answer"
                          : ""}
                    </span>
                    <p>{option.body}</p>
                  </div>
                ))}
              </div>
            )}
            {question.type === "NUMERIC" && (
              <p className="answer-line">
                Your answer:{" "}
                <strong>{question.numericAnswer ?? "Not answered"}</strong> ·
                Correct answer:{" "}
                <strong>{String(question.answerConfig.value ?? "")}</strong>
              </p>
            )}
            {question.type === "TEXT" && (
              <p className="answer-line">
                Your answer:{" "}
                <strong>{question.textAnswer || "Not answered"}</strong> ·
                Accepted:{" "}
                <strong>
                  {Array.isArray(question.answerConfig.acceptedAnswers)
                    ? question.answerConfig.acceptedAnswers.join(", ")
                    : ""}
                </strong>
              </p>
            )}
            <div className="explanation">
              <strong>Explanation</strong>
              <p>
                {question.explanation ||
                  "No explanation was provided for this question."}
              </p>
            </div>
          </article>
        ))}
      </section>
      {result.attemptsUsed < result.maxAttempts && <div className="result-actions"><Link className="button" href={`/tests/${result.testId}${courseSlug ? `?course=${encodeURIComponent(courseSlug)}` : ""}`}>Retake test</Link><span>{result.maxAttempts - result.attemptsUsed} attempt{result.maxAttempts - result.attemptsUsed === 1 ? "" : "s"} remaining</span></div>}
    </WorkspaceShell>
  );
}
