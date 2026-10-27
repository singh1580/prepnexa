import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentNotifications } from "@/features/operations/service";
import { getStudentTest } from "@/features/student-tests/service";
import { AppError } from "@/lib/errors/app-error";
import { TestInstructionsStart } from "@/features/student-tests/ui/test-instructions-start";

export const metadata = { title: "Test instructions" };
function TestIcon({
  name,
}: {
  name: "time" | "questions" | "marks" | "attempt" | "format" | "rules";
}) {
  const paths = {
    time: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    questions: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h5M8 16h7" />
      </>
    ),
    marks: (
      <>
        <path d="M5 4h14v16H5zM8 9l2 2 5-5" />
      </>
    ),
    attempt: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12h8M12 8v8" />
      </>
    ),
    format: (
      <>
        <path d="M5 4h14v16H5zM8 8h8M8 12h5" />
      </>
    ),
    rules: (
      <>
        <path d="M12 3 5 6v5c0 4.5 2.8 8.3 7 10 4.2-1.7 7-5.5 7-10V6z" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
  };
  return (
    <svg
      className="size-[1.2rem]"
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
  params: Promise<{ id: string }>;
  searchParams: Promise<{ course?: string }>;
}) {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const notificationsPromise = getStudentNotifications(auth.user.id);
  const courseSlug = (await searchParams).course;
  let test;
  try {
    test = await getStudentTest((await params).id, auth.user.id, courseSlug);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  const notifications = await notificationsPromise;
  const exhausted =
    test.attemptsUsed >= test.maxAttempts && !test.activeAttemptId;
  const resolvedCourseSlug = test.productSlug ?? courseSlug;
  const courseHref = resolvedCourseSlug
    ? `/dashboard/courses/${encodeURIComponent(resolvedCourseSlug)}?view=tests`
    : "/dashboard/courses";
  const sectionCount = test.sectionCount;
  return (
    <WorkspaceShell
      admin={false}
      name={auth.user.name}
      email={auth.user.email}
      section="courses"
      unreadNotifications={notifications.unreadCount}
      activePackageSlug={resolvedCourseSlug}
      activePackageView="tests"
    >
      <nav
        className="mb-3 flex max-w-full flex-wrap items-center gap-x-[.45rem] gap-y-[.32rem] text-[.68rem] leading-[1.35] text-[#7c8287] [&_a:hover]:text-prep-orange"
        aria-label="Breadcrumb"
      >
        <Link href="/dashboard/courses">My Packages</Link>
        <span>›</span>
        {resolvedCourseSlug ? (
          <>
            <Link href={courseHref}>
              {resolvedCourseSlug.replaceAll("-", " ")}
            </Link>
            <span>›</span>
          </>
        ) : null}
        <b className="min-w-0 max-w-full break-words text-[#44494e]">
          {test.title}
        </b>
      </nav>
      <header className="border-b border-[#e8e5e1] pt-[.35rem] pb-4">
        <h1 className="mt-0 mb-[.45rem] text-[clamp(1.75rem,3vw,2.35rem)] leading-tight tracking-[-.045em] break-words">
          {test.title}
        </h1>
        <p className="m-0 max-w-[55rem] text-[.9rem] leading-[1.6] text-[#666c72]">
          {test.instructions?.split("\n").find(Boolean) ||
            "Full-length mock test designed to simulate the actual exam pattern and difficulty level."}
        </p>
      </header>
      {!test.hasAccess ? (
        <section className="mt-5 rounded-xl border border-dashed border-[#d9d6d2] bg-white px-5 py-12 text-center">
          <h2 className="m-0 text-lg">Access required</h2>
          <p className="mt-2 mb-4 text-[.82rem] text-[#687077]">
            This test is not included in your active packages.
          </p>
          <Link
            className="inline-flex rounded-[.4rem] bg-prep-orange px-4 py-2 text-[.75rem] font-bold text-white hover:bg-prep-orange-dark"
            href="/packages"
          >
            Explore packages
          </Link>
        </section>
      ) : (
        <>
          <section className="my-[1.1rem] mb-8 grid grid-cols-4 border-b border-[#e8e5e1] max-[900px]:grid-cols-2 max-[500px]:grid-cols-1 [&>article]:flex [&>article]:items-center [&>article]:gap-[.8rem] [&>article]:px-[1.2rem] [&>article]:pt-[.2rem] [&>article]:pb-4 [&>article:first-child]:pl-0 [&>article+article]:border-l [&>article+article]:border-[#e8e5e1] max-[900px]:[&>article:nth-child(3)]:border-l-0 max-[900px]:[&>article:nth-child(n+3)]:border-t max-[900px]:[&>article:nth-child(n+3)]:pt-4 max-[500px]:[&>article]:border-l-0 max-[500px]:[&>article]:border-t max-[500px]:[&>article]:px-0 max-[500px]:[&>article]:py-[.8rem] [&_i]:grid [&_i]:size-[2.55rem] [&_i]:shrink-0 [&_i]:place-items-center [&_i]:rounded-full [&_i]:bg-[#fff0e8] [&_i]:text-[#e84916] [&_article>div]:grid [&_article>div]:gap-[.18rem] [&_strong]:text-[.9rem] [&_span]:text-[.75rem] [&_span]:text-[#757b80]">
            <article>
              <i>
                <TestIcon name="time" />
              </i>
              <div>
                <strong>{test.durationMinutes} minutes</strong>
                <span>Duration</span>
              </div>
            </article>
            <article>
              <i>
                <TestIcon name="questions" />
              </i>
              <div>
                <strong>{test.questionCount} questions</strong>
                <span>Total questions</span>
              </div>
            </article>
            <article>
              <i>
                <TestIcon name="marks" />
              </i>
              <div>
                <strong>Per question</strong>
                <span>Marks shown in test</span>
              </div>
            </article>
            <article>
              <i>
                <TestIcon name="attempt" />
              </i>
              <div>
                <strong>
                  {test.maxAttempts} attempt{test.maxAttempts === 1 ? "" : "s"}
                </strong>
                <span>Allowed</span>
              </div>
            </article>
          </section>
          <section className="border-b border-[#e8e5e1] pb-[1.4rem]">
            <h2 className="mt-0 mb-[1.35rem] text-[1.2rem]">
              Important instructions
            </h2>
            <div className="grid gap-5 [&>article]:flex [&>article]:items-start [&>article]:gap-4 [&_i]:grid [&_i]:size-[2.55rem] [&_i]:shrink-0 [&_i]:place-items-center [&_i]:rounded-full [&_i]:bg-[#fff0e8] [&_i]:text-[#e84916] [&_h3]:mt-[.1rem] [&_h3]:mb-[.32rem] [&_h3]:text-[.95rem] [&_p]:m-0 [&_p]:text-[.82rem] [&_p]:leading-[1.55] [&_p]:text-[#62686e] [&_li]:text-[.82rem] [&_li]:leading-[1.55] [&_li]:text-[#62686e] [&_ul]:mt-[.2rem] [&_ul]:mb-0 [&_ul]:pl-[1.1rem]">
              <article>
                <i>
                  <TestIcon name="format" />
                </i>
                <div>
                  <h3>Test format</h3>
                  <p>
                    The test consists of {sectionCount || "multiple"} section
                    {sectionCount === 1 ? "" : "s"}
                    {sectionCount ? ` and ${test.questionCount} questions` : ""}
                    . Use the section tabs during the test to move between
                    sections.
                  </p>
                </div>
              </article>
              <article>
                <i>
                  <TestIcon name="marks" />
                </i>
                <div>
                  <h3>Marking scheme</h3>
                  <p>
                    Marks and negative marks are displayed with each question.
                    Read them before selecting your answer.
                  </p>
                </div>
              </article>
              <article>
                <i>
                  <TestIcon name="time" />
                </i>
                <div>
                  <h3>Time management</h3>
                  <p>
                    Total duration is {test.durationMinutes} minutes. You can
                    switch between sections any time before submission.
                  </p>
                </div>
              </article>
              <article>
                <i>
                  <TestIcon name="attempt" />
                </i>
                <div>
                  <h3>Attempt policy</h3>
                  <p>
                    You have {test.maxAttempts} attempt
                    {test.maxAttempts === 1 ? "" : "s"} for this test. Submitted
                    attempts cannot be reopened.
                  </p>
                </div>
              </article>
              <article>
                <i>
                  <TestIcon name="rules" />
                </i>
                <div>
                  <h3>General guidelines</h3>
                  <ul>
                    <li>Ensure a stable internet connection.</li>
                    <li>
                      Do not refresh or close the browser during submission.
                    </li>
                    <li>Your answers are auto-saved as you continue.</li>
                    <li>Follow all on-screen instructions carefully.</li>
                  </ul>
                </div>
              </article>
            </div>
          </section>
          <div className="pt-5">
            <TestInstructionsStart
              testId={test.id}
              activeAttemptId={test.activeAttemptId}
              courseSlug={resolvedCourseSlug}
              exhausted={exhausted}
            />
          </div>
        </>
      )}
    </WorkspaceShell>
  );
}
