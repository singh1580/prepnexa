import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentNotifications } from "@/features/operations/service";
import { getStudentCourse } from "@/features/student-courses/service";
import { courseProgress } from "@/features/student-courses/progress";
import { MaterialsBrowser } from "@/features/student-courses/ui/materials-browser";
import { normaliseProductName } from "@/features/catalog/presentation";

const views = ["overview", "materials", "tests", "results"] as const;
type CourseView = (typeof views)[number];
const isView = (value: string | undefined): value is CourseView =>
  views.includes(value as CourseView);
const courseAction =
  "inline-flex min-h-[2.65rem] items-center justify-center rounded-[.4rem] border border-prep-orange bg-prep-orange px-4 text-[.75rem] font-bold text-white hover:bg-prep-orange-dark";
const courseSecondaryAction =
  "inline-flex min-h-[2.65rem] items-center justify-center rounded-[.4rem] border border-[#d9dadd] bg-white px-4 text-[.75rem] font-bold text-[#343a3f] hover:bg-[#f9fafb]";
const courseSectionHeading =
  "mb-4 flex items-end justify-between gap-4 max-[560px]:items-start [&_h2]:m-0 [&_h2]:text-[1rem] [&_p]:mt-1 [&_p]:mb-0 [&_p]:text-[.75rem] [&_p]:text-prep-muted [&>a]:text-[.72rem] [&>a]:font-bold [&>a]:text-prep-orange-dark";
function WorkspaceIcon({
  name,
}: {
  name: "book" | "test" | "result" | "play";
}) {
  const paths = {
    book: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
        <path d="M4 5.5v16" />
      </>
    ),
    test: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
    result: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
    play: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m10 8 6 4-6 4z" />
      </>
    ),
  };
  return (
    <svg
      className="size-4"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const { slug } = await params;
  const query = await searchParams;
  const view: CourseView = isView(query.view) ? query.view : "overview";
  const [course, notifications] = await Promise.all([
    getStudentCourse(slug, auth.user.id),
    getStudentNotifications(auth.user.id),
  ]);
  if (!course) notFound();
  const progress = courseProgress(course);
  const courseName = normaliseProductName(course.name);
  const viewLabel =
    view === "overview"
      ? "Overview"
      : view === "materials"
        ? "Study materials"
        : view === "tests"
          ? "Tests & practice sets"
          : "Results & analysis";
  const recentActivity = [
    ...course.results.slice(0, 3).map((result) => ({
      id: result.id,
      title: `Completed ${result.title}`,
      meta: `Score ${result.score} / ${result.maxScore}`,
      date: result.publishedAt,
      href: `/results/${result.id}?course=${slug}`,
      icon: "result" as const,
    })),
    ...(course.activeAttemptId
      ? [
          {
            id: course.activeAttemptId,
            title: `Continued ${course.activeTestTitle ?? "test"}`,
            meta: "Attempt in progress",
            date: null,
            href: `/attempts/${course.activeAttemptId}?course=${slug}`,
            icon: "test" as const,
          },
        ]
      : []),
  ].slice(0, 3);
  return (
    <WorkspaceShell
      admin={false}
      name={auth.user.name}
      email={auth.user.email}
      section="courses"
      unreadNotifications={notifications.unreadCount}
      activePackageSlug={slug}
      activePackageView={view}
    >
      <nav
        className="mb-5 flex flex-wrap items-center gap-x-[.45rem] gap-y-[.32rem] text-[.72rem] leading-[1.35] text-[#70777d] [&_a]:font-semibold [&_a:hover]:text-prep-orange-dark [&_b]:min-w-0 [&_b]:[overflow-wrap:anywhere] [&_b]:text-[#252a2e]"
        aria-label="Breadcrumb"
      >
        <Link href="/dashboard">Dashboard</Link>
        <span>›</span>
        <Link href="/dashboard/courses">My Packages</Link>
        <span>›</span>
        <Link href={`/dashboard/courses/${slug}`}>{courseName}</Link>
        <span>›</span>
        <b>{viewLabel}</b>
      </nav>
      <header className="mb-[1.1rem] flex items-end justify-between gap-4 border-b border-[#e8e5e1] pb-4 max-[800px]:flex-col max-[800px]:items-start">
        <div>
          <h1 className="m-0 text-[clamp(1.55rem,3vw,2.2rem)] font-bold tracking-[-.035em]">
            {view === "overview" ? courseName : viewLabel}
          </h1>
          {view !== "overview" ? (
            <p className="mt-1 mb-0 max-w-[46rem] text-[.82rem] leading-relaxed text-prep-muted">
              {view === "materials"
                ? "Browse your package resources by subject and topic."
                : view === "tests"
                  ? "Continue mock tests and practice sets included in this package."
                  : "Review your completed test performance."}
            </p>
          ) : null}
        </div>
      </header>

      {view === "overview" ? (
        <>
          <section className="grid grid-cols-[7rem_minmax(0,1fr)_auto] items-center gap-[1.3rem] rounded-[.55rem] border border-[#e4e2df] bg-white p-[1.1rem] max-[800px]:grid-cols-[5.5rem_minmax(0,1fr)] max-[800px]:gap-[.9rem] max-[800px]:p-4 max-[560px]:grid-cols-1 max-[560px]:text-center">
            <div
              className="relative grid size-[6.2rem] place-items-center rounded-full bg-[conic-gradient(#eb4814_var(--progress),#eee_var(--progress))] after:absolute after:inset-[.55rem] after:rounded-full after:bg-white max-[800px]:size-20 max-[560px]:mx-auto"
              style={{ "--progress": `${progress * 3.6}deg` } as CSSProperties}
            >
              <span className="relative z-[1] grid text-center">
                <b className="text-xl">{progress}%</b>
                <small className="text-[.55rem] text-prep-muted">
                  complete
                </small>
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="m-0 text-[1.05rem]">Your progress</h2>
              <p className="mt-[.3rem] mb-[.8rem] text-[.75rem] text-[#7b8085]">
                Continue learning and completing tests to move forward.
              </p>
              <div className="flex gap-[1.2rem] max-[800px]:grid max-[800px]:grid-cols-2 max-[800px]:gap-[.65rem] max-[560px]:text-left [&>span:last-child]:max-[800px]:col-span-full">
                <span className="grid text-[.58rem] text-[#777d82]">
                  <b className="text-[.78rem] text-[#303438]">
                    {course.completedTests}
                  </b>{" "}
                  tests completed
                </span>
                <span className="grid text-[.58rem] text-[#777d82]">
                  <b className="text-[.78rem] text-[#303438]">
                    {Math.max(0, course.testCount - course.completedTests)}
                  </b>{" "}
                  tests remaining
                </span>
                <span className="grid text-[.58rem] text-[#777d82]">
                  <b className="text-[.78rem] text-[#303438]">
                    {course.viewedMaterialCount} / {course.materialCount}
                  </b>{" "}
                  resources opened
                </span>
              </div>
            </div>
            {course.activeAttemptId ? (
              <Link
                className="rounded-[.35rem] border border-[#e84916] px-[.85rem] py-[.65rem] text-[.65rem] font-bold text-prep-orange max-[800px]:col-span-full max-[800px]:text-center"
                href={`/attempts/${course.activeAttemptId}?course=${slug}`}
              >
                Resume test <b>→</b>
              </Link>
            ) : null}
          </section>
          <section className="mt-6">
            <div className={courseSectionHeading}>
              <div>
                <h2>Package content</h2>
                <p>Open the exact part of this learning package you need.</p>
              </div>
            </div>
            <div className="grid rounded-lg border border-[#e4e2df]">
              <Link
                className="grid grid-cols-[2rem_minmax(0,1fr)_2.2rem] items-center gap-[.7rem] p-3 hover:bg-[#fff8f4]"
                href={`/dashboard/courses/${slug}?view=materials`}
              >
                <span className="grid size-[1.7rem] place-items-center rounded-full bg-[#fff0e8] text-[.58rem] font-extrabold text-prep-orange">
                  01
                </span>
                <div className="grid gap-[.15rem]">
                  <strong className="text-[.9rem]">Study materials</strong>
                  <small className="text-[.75rem] text-prep-muted">
                    {course.materialCount} learning resources
                  </small>
                </div>
                <i className="grid size-8 place-items-center rounded-[.35rem] bg-[#f4f5f5] text-[#697076]">
                  <WorkspaceIcon name="book" />
                </i>
              </Link>
              <Link
                className="grid grid-cols-[2rem_minmax(0,1fr)_2.2rem] items-center gap-[.7rem] border-t border-[#eceae7] p-3 hover:bg-[#fff8f4]"
                href={`/dashboard/courses/${slug}?view=tests`}
              >
                <span className="grid size-[1.7rem] place-items-center rounded-full bg-[#fff0e8] text-[.58rem] font-extrabold text-prep-orange">
                  02
                </span>
                <div className="grid gap-[.15rem]">
                  <strong className="text-[.9rem]">Tests &amp; practice</strong>
                  <small className="text-[.75rem] text-prep-muted">
                    {course.testCount} tests
                  </small>
                </div>
                <i className="grid size-8 place-items-center rounded-[.35rem] bg-[#f4f5f5] text-[#697076]">
                  <WorkspaceIcon name="test" />
                </i>
              </Link>
            </div>
          </section>
          <section className="mt-6">
            <div className={courseSectionHeading}>
              <div>
                <h2>Recent activity</h2>
                <p>Your latest progress in this package</p>
              </div>
              <Link href={`/dashboard/courses/${slug}?view=results`}>
                View all <span>→</span>
              </Link>
            </div>
            {recentActivity.length ? (
              <div className="grid rounded-lg border border-[#e4e2df]">
                {recentActivity.map((item) => (
                  <Link
                    className="grid grid-cols-[2.2rem_minmax(0,1fr)_auto] items-center gap-[.7rem] border-t border-[#eceae7] p-3 first:border-t-0"
                    href={item.href}
                    key={item.id}
                  >
                    <i className="grid size-8 place-items-center rounded-full bg-[#fff0e8] text-[#e54816]">
                      <WorkspaceIcon name={item.icon} />
                    </i>
                    <div className="grid gap-[.15rem]">
                      <strong className="text-[.9rem]">{item.title}</strong>
                      <small className="text-[.75rem] text-prep-muted">
                        {item.meta}
                      </small>
                    </div>
                    <span className="text-[.58rem] text-prep-muted">
                      {item.date
                        ? new Date(item.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })
                        : "Now"}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#ddd8d3] p-8 text-center text-[#73787d]">
                <p>Your learning activity will appear here.</p>
              </div>
            )}
          </section>
        </>
      ) : null}

      {view === "materials" ? (
        <MaterialsBrowser
          materials={course.materials.map((item) => ({
            ...item,
            lastAccessed: item.lastAccessed
              ? new Date(item.lastAccessed).toISOString()
              : null,
          }))}
          courseSlug={slug}
        />
      ) : null}
      {view === "tests" ? (
        course.tests.length ? (
          <div className="grid grid-cols-1 gap-[.7rem]">
            {course.tests.map((test) => {
              const remaining = Math.max(
                0,
                test.maxAttempts - test.attemptsUsed,
              );
              return (
                <article
                  className="grid min-h-0 grid-cols-[3rem_minmax(0,1fr)_auto_minmax(9.5rem,auto)] items-center gap-4 rounded-[.55rem] border border-[#e3e1de] bg-white px-[1.1rem] py-4 shadow-[0_1px_2px_rgba(30,35,40,.03)] max-[900px]:grid-cols-[3rem_minmax(0,1fr)_auto] max-[700px]:grid-cols-[2.5rem_minmax(0,1fr)] max-[700px]:gap-3 max-[700px]:p-[.85rem]"
                  key={test.id}
                >
                  <i className="grid size-12 place-items-center rounded-lg bg-[#fff1e9] text-[#e94b17] max-[700px]:size-10 [&>svg]:size-[1.35rem]">
                    <WorkspaceIcon name="test" />
                  </i>
                  <div className="min-w-0">
                    <span className="text-[.62rem] font-extrabold tracking-[.07em] text-[#e14a18]">
                      {test.category?.replaceAll("_", " ") || test.mode}
                    </span>
                    <h2 className="mt-[.2rem] mb-[.45rem] text-[.92rem] max-[700px]:mb-[.35rem]">
                      {test.title}
                    </h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 max-[700px]:grid max-[700px]:grid-cols-3 max-[380px]:grid-cols-2 max-[380px]:[&>small:last-child]:col-span-full">
                      <small className="text-[.68rem] text-[#777e83]">
                        <b className="text-[#353a3e]">{test.questionCount}</b>{" "}
                        questions
                      </small>
                      <small className="text-[.68rem] text-[#777e83]">
                        <b className="text-[#353a3e]">{test.durationMinutes}</b>{" "}
                        minutes
                      </small>
                      <small className="text-[.68rem] text-[#777e83]">
                        <b className="text-[#353a3e]">{remaining}</b> attempts
                        left
                      </small>
                    </div>
                  </div>
                  <div className="grid justify-items-end gap-[.35rem] max-[700px]:col-start-2 max-[700px]:flex max-[700px]:items-center max-[700px]:justify-start max-[700px]:gap-[.55rem]">
                    <span
                      className={`rounded-full px-[.48rem] py-1 text-[.61rem] font-bold ${
                        test.activeAttemptId
                          ? "bg-[#fff3e6] text-[#bb571d]"
                          : test.latestResultId
                            ? "bg-[#eef4fb] text-[#3c638f]"
                            : "bg-[#edf8f1] text-[#207a47]"
                      }`}
                    >
                      {test.activeAttemptId
                        ? "In progress"
                        : test.latestResultId
                          ? "Attempted"
                          : "Ready"}
                    </span>
                    {test.latestResultId ? (
                      <Link
                        className="text-[.65rem] font-bold text-[#d94715]"
                        href={`/results/${test.latestResultId}?course=${slug}`}
                      >
                        View result
                      </Link>
                    ) : null}
                  </div>
                  <div className="max-[900px]:col-start-2 max-[900px]:col-end-[-1] max-[700px]:col-start-2 max-[700px]:w-full [&>a]:min-w-[9.5rem] max-[900px]:[&>a]:w-full">
                    {test.activeAttemptId ? (
                      <Link
                        className={courseAction}
                        href={`/attempts/${test.activeAttemptId}?course=${slug}`}
                      >
                        Resume test <b>→</b>
                      </Link>
                    ) : remaining ? (
                      <Link
                        className={courseAction}
                        href={`/tests/${test.id}?course=${slug}`}
                      >
                        View instructions <b>→</b>
                      </Link>
                    ) : (
                      <span className="inline-flex rounded-full bg-[#eff3f6] px-3 py-[.4rem] text-[.76rem] text-[#687c90]">
                        Attempts completed
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <section className="mt-4 rounded-xl border border-dashed border-[#d8d5d0] bg-white px-6 py-14 text-center">
            <h2 className="m-0 text-lg font-bold">No tests assigned</h2>
            <p className="mx-auto mt-2 max-w-[38rem] text-sm text-prep-muted">
              Tests and practice sets included in this package will appear here.
            </p>
          </section>
        )
      ) : null}
      {view === "results" ? (
        course.results.length ? (
          <div className="grid gap-3.5">
            {course.results.map((result) => {
              const percentage = Number(result.maxScore)
                ? Math.round(
                    (Number(result.score) / Number(result.maxScore)) * 100,
                  )
                : 0;
              return (
                <article
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-6 rounded-xl border border-prep-line bg-white p-5 max-[760px]:grid-cols-[minmax(0,1fr)_auto] max-[760px]:gap-4"
                  key={result.id}
                >
                  <div className="min-w-0">
                    <span className="eyebrow">ATTEMPT {result.sequence}</span>
                    <h2 className="mt-1 mb-1 [overflow-wrap:anywhere]">
                      {result.title}
                    </h2>
                    <p className="m-0 text-sm text-prep-muted">
                      {new Date(result.publishedAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="flex items-baseline justify-end gap-1 whitespace-nowrap max-[760px]:col-start-2 max-[760px]:row-start-1">
                    <strong className="text-[2rem] text-prep-ink">
                      {percentage}%
                    </strong>
                    <span className="text-[.82rem] text-prep-muted">
                      {result.score} / {result.maxScore}
                    </span>
                  </div>
                  <div className="grid gap-1 text-sm text-prep-muted max-[760px]:col-span-full max-[760px]:grid-cols-2 max-[760px]:border-y max-[760px]:border-[#ece9e5] max-[760px]:py-3 max-[760px]:text-center">
                    <span>{result.correctCount} correct</span>
                    <span>{result.incorrectCount} incorrect</span>
                  </div>
                  <Link
                    className={`${courseSecondaryAction} max-[760px]:col-span-full max-[760px]:w-full`}
                    href={`/results/${result.id}?course=${slug}`}
                  >
                    View analysis
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <section className="mt-4 rounded-xl border border-dashed border-[#d8d5d0] bg-white px-6 py-14 text-center">
            <h2 className="m-0 text-lg font-bold">No results yet</h2>
            <p className="mx-auto mt-2 mb-4 max-w-[38rem] text-sm text-prep-muted">
              Evaluated test attempts from this package will appear here.
            </p>
            <Link
              className={courseAction}
              href={`/dashboard/courses/${slug}?view=tests`}
            >
              View tests
            </Link>
          </section>
        )
      ) : null}
    </WorkspaceShell>
  );
}
