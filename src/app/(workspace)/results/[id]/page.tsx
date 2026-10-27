import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentNotifications } from "@/features/operations/service";
import {
  ResultReviewTable,
  type ReviewQuestionView,
} from "@/features/student-results/result-review-table";
import { getStudentResult } from "@/features/student-results/service";
import { entityIdSchema } from "@/features/student-tests/validation";
import { AppError } from "@/lib/errors/app-error";

type Breakdown = {
  title: string;
  score: string;
  maxScore: string;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeSpentSeconds: number;
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
  publishedAt: Date;
  sections: Breakdown[];
  questions: ReviewQuestionView[];
  testId: string;
  productSlug: string | null;
  maxAttempts: number;
  attemptsUsed: number;
};
export const metadata = { title: "Result analysis" };
function ActionIcon({ name }: { name: "back" | "retake" }) {
  return (
    <svg
      className="size-4"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "back" ? (
        <>
          <path d="m15 18-6-6 6-6" />
          <path d="M9 12h11" />
        </>
      ) : (
        <>
          <path d="M20 11a8 8 0 1 0-2.3 5.7" />
          <path d="M20 4v7h-7" />
        </>
      )}
    </svg>
  );
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ course?: string }>;
}) {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const parsed = entityIdSchema.safeParse((await params).id);
  if (!parsed.success) notFound();
  const notificationsPromise = getStudentNotifications(auth.user.id);
  let raw;
  try {
    raw = await getStudentResult(parsed.data, auth.user.id);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  const [result, notifications] = [
    raw as unknown as ResultView,
    await notificationsPromise,
  ];
  const requestedCourse = (await searchParams).course;
  const courseSlug = result.productSlug || requestedCourse;
  const courseHref = courseSlug
    ? `/dashboard/courses/${encodeURIComponent(courseSlug)}?view=results`
    : "/dashboard/courses";
  const attempted = result.correctCount + result.incorrectCount;
  const accuracy = attempted
    ? Math.round((result.correctCount / attempted) * 100)
    : 0;
  const sections = result.sections.map((section) => {
    const total =
      section.correctCount + section.incorrectCount + section.unansweredCount;
    return {
      ...section,
      total,
      accuracy: total ? Math.round((section.correctCount / total) * 100) : 0,
    };
  });
  const strengths = sections
    .filter((section) => section.accuracy >= 70)
    .sort((a, b) => b.accuracy - a.accuracy);
  const needsWork = sections
    .filter((section) => section.accuracy < 70)
    .sort((a, b) => a.accuracy - b.accuracy);
  return (
    <WorkspaceShell
      admin={false}
      name={auth.user.name}
      email={auth.user.email}
      section="courses"
      unreadNotifications={notifications.unreadCount}
      activePackageSlug={courseSlug}
      activePackageView="results"
    >
      <nav
        className="mb-3 flex max-w-full flex-wrap items-center gap-x-[.45rem] gap-y-[.32rem] text-[.68rem] leading-[1.35] text-[#7c8287] [&_a:hover]:text-prep-orange"
        aria-label="Breadcrumb"
      >
        <Link href="/dashboard/courses">My Packages</Link>
        <span>›</span>
        {courseSlug ? (
          <Link href={courseHref}>{courseSlug.replaceAll("-", " ")}</Link>
        ) : null}
        <span>›</span>
        <b className="min-w-0 max-w-full break-words text-[#44494e]">
          {result.title}
        </b>
      </nav>
      <header className="border-b border-[#e5e2de] pb-4">
        <h1 className="mt-0 mb-2 text-[clamp(1.75rem,3vw,2.35rem)] leading-tight tracking-[-.045em] break-words">
          {result.title}
        </h1>
        <p className="m-0 flex flex-wrap items-center gap-2 text-[.78rem] text-prep-muted max-[500px]:flex-col max-[500px]:items-start max-[500px]:gap-[.2rem]">
          Completed on{" "}
          {new Date(result.publishedAt).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
          <i className="size-1 rounded-full bg-[#b2b5b8] max-[500px]:hidden" />
          Time taken: {Math.floor(result.timeSpentSeconds / 60)} minutes
        </p>
      </header>
      <section className="mt-5 rounded-[.55rem] border border-[#e3e1de] bg-white">
        <h2 className="m-0 border-b border-[#e3e1de] px-4 py-3 text-[.95rem]">
          Your performance
        </h2>
        <div className="grid grid-cols-5 max-[900px]:grid-cols-3 max-[500px]:grid-cols-2 [&>article]:grid [&>article]:min-w-0 [&>article]:gap-1 [&>article]:border-r [&>article]:border-[#e3e1de] [&>article]:p-4 max-[900px]:[&>article:nth-child(n+4)]:border-t max-[500px]:[&>article:nth-child(n+3)]:border-t max-[500px]:[&>article:nth-child(2n)]:border-r-0 [&_strong]:text-[1.35rem] [&_span]:text-[.68rem] [&_span]:leading-snug [&_span]:text-prep-muted">
          <article className="max-[900px]:border-r">
            <strong className="text-[#25292c]!">{result.score}</strong>
            <span>
              Score
              <br />
              (out of {result.maxScore})
            </span>
          </article>
          <article>
            <strong className="text-[#16804c]!">{accuracy}%</strong>
            <span>Accuracy</span>
          </article>
          <article className="max-[900px]:border-r-0 max-[500px]:border-r">
            <strong className="text-[#16804c]!">{result.correctCount}</strong>
            <span>Correct</span>
          </article>
          <article>
            <strong className="text-[#d9342c]!">{result.incorrectCount}</strong>
            <span>Incorrect</span>
          </article>
          <article className="border-r-0!">
            <strong className="text-[#686e73]!">
              {result.unansweredCount}
            </strong>
            <span>Unanswered</span>
          </article>
        </div>
      </section>
      <section className="mt-6">
        <h2 className="mb-3 text-[1rem]">Section-wise performance</h2>
        <div className="overflow-hidden rounded-[.5rem] border border-[#e3e1de] bg-white">
          <div className="grid grid-cols-[1.2fr_1.3fr_.65fr_.75fr] gap-4 bg-[#f7f6f4] px-4 py-3 text-[.65rem] font-semibold text-[#72787d] max-[700px]:hidden">
            <span>Section</span>
            <span>Correct / Total</span>
            <span>Accuracy</span>
            <span>Score (out of)</span>
          </div>
          {sections.map((section) => (
            <article
              className="grid grid-cols-[1.2fr_1.3fr_.65fr_.75fr] items-center gap-4 border-t border-[#e8e6e2] px-4 py-3 text-[.72rem] max-[700px]:grid-cols-2 max-[700px]:gap-x-5 max-[700px]:gap-y-3"
              key={section.title}
            >
              <strong className="min-w-0 break-words max-[700px]:col-span-full">
                {section.title}
              </strong>
              <div className="grid gap-1 max-[700px]:col-span-full">
                <span>
                  {section.correctCount} / {section.total}
                </span>
                <i className="block h-1.5 overflow-hidden rounded-full bg-[#ebe9e6]">
                  <b
                    className="block h-full rounded-full bg-[#e84916]"
                    style={{ width: `${section.accuracy}%` }}
                  />
                </i>
              </div>
              <span className="max-[700px]:grid max-[700px]:gap-1 max-[700px]:before:text-[.62rem] max-[700px]:before:text-[#72787d] max-[700px]:before:content-['Accuracy']">
                <b className="font-semibold">{section.accuracy}%</b>
              </span>
              <span className="text-right max-[700px]:grid max-[700px]:gap-1 max-[700px]:before:text-[.62rem] max-[700px]:before:text-[#72787d] max-[700px]:before:content-['Score']">
                <b className="font-semibold">
                  {section.score} / {section.maxScore}
                </b>
              </span>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-6">
        <h2 className="mb-3 text-[1rem]">Strengths and areas to work on</h2>
        <div className="grid grid-cols-2 overflow-hidden rounded-[.5rem] border border-[#e5e0da] bg-white max-[700px]:grid-cols-1">
          <article className="p-4">
            <h3 className="m-0 text-[.85rem] text-[#16804c]">
              ↑ <span>Strengths</span>
            </h3>
            {strengths.length ? (
              <ul className="mt-[.65rem] mb-0 pl-[1.15rem] text-[.73rem] leading-[1.45] text-[#555c62]">
                {strengths.map((section) => (
                  <li key={section.title}>
                    Good accuracy in {section.title} ({section.accuracy}%)
                  </li>
                ))}
              </ul>
            ) : (
              <p className="my-[.35rem] text-[.73rem] leading-[1.45] text-[#555c62]">
                Complete more correct answers to build a strong section.
              </p>
            )}
          </article>
          <article className="border-l border-[#e5e0da] p-4 max-[700px]:border-t max-[700px]:border-l-0">
            <h3 className="m-0 text-[.85rem] text-[#df2e2e]">
              ↓ <span>Needs work</span>
            </h3>
            {needsWork.length ? (
              <ul className="mt-[.65rem] mb-0 pl-[1.15rem] text-[.73rem] leading-[1.45] text-[#555c62]">
                {needsWork.map((section) => (
                  <li key={section.title}>
                    Improve accuracy in {section.title} ({section.accuracy}%)
                  </li>
                ))}
              </ul>
            ) : (
              <p className="my-[.35rem] text-[.73rem] leading-[1.45] text-[#555c62]">
                No weak section detected in this attempt.
              </p>
            )}
          </article>
        </div>
      </section>
      <ResultReviewTable questions={result.questions} />
      <footer className="mt-[1.3rem] flex items-center justify-between gap-3 border-t border-[#e5e2de] pt-4 max-[500px]:flex-col-reverse max-[500px]:items-stretch">
        <Link
          className="flex min-h-[2.55rem] min-w-40 items-center justify-center gap-2 rounded-[.38rem] border border-[#c8c9ca] px-4 py-[.65rem] text-[.75rem] font-bold hover:bg-[#f5f5f4] max-[500px]:w-full"
          href={courseHref}
        >
          <ActionIcon name="back" />
          Back to package
        </Link>
        {courseSlug && result.attemptsUsed < result.maxAttempts ? (
          <Link
            className="flex min-h-[2.55rem] min-w-40 items-center justify-center gap-2 rounded-[.38rem] border border-prep-orange bg-prep-orange px-4 py-[.65rem] text-[.75rem] font-bold text-white hover:bg-prep-orange-dark max-[500px]:w-full"
            href={`/tests/${result.testId}?course=${encodeURIComponent(courseSlug)}`}
          >
            <ActionIcon name="retake" />
            Retake test
          </Link>
        ) : null}
      </footer>
    </WorkspaceShell>
  );
}
