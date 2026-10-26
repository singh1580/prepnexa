import { ProductCoverImage } from "@/components/product-cover-image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { StudentHeroCarousel } from "@/components/hero-carousel";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentNotifications } from "@/features/operations/service";
import { getStudentCourseDashboard } from "@/features/student-courses/service";
import { courseProgress } from "@/features/student-courses/progress";
import {
  meaningfulProductDescription,
  normaliseProductName,
} from "@/features/catalog/presentation";

export const metadata = { title: "Student dashboard" };

function DashboardIcon({
  name,
}: {
  name:
    "package" | "progress" | "test" | "bell" | "explore" | "order" | "support";
}) {
  const paths = {
    package: (
      <>
        <path d="m4 7 8-4 8 4-8 4z" />
        <path d="m4 7v10l8 4 8-4V7M12 11v10" />
      </>
    ),
    progress: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    test: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
    explore: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    order: (
      <>
        <path d="M6 2h12v20l-3-2-3 2-3-2-3 2z" />
        <path d="M9 7h6M9 11h6" />
      </>
    ),
    support: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.6 2.6 0 1 1 4.2 2c-1 .7-1.7 1.2-1.7 2.5M12 17h.01" />
      </>
    ),
  };
  return (
    <svg
      className="size-[1.15rem]"
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

export default async function Page() {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const [{ courses, summary, recentResults }, notifications] =
    await Promise.all([
      getStudentCourseDashboard(auth.user.id),
      getStudentNotifications(auth.user.id),
    ]);
  const totalItems = courses.reduce(
    (total, course) => total + course.testCount + course.materialCount,
    0,
  );
  const completedItems = courses.reduce(
    (total, course) =>
      total +
      Math.min(course.completedTests, course.testCount) +
      Math.min(course.viewedMaterialCount, course.materialCount),
    0,
  );
  const completedAttempts = courses.reduce(
    (total, course) => total + course.completedAttempts,
    0,
  );
  const progress = totalItems
    ? Math.round((completedItems / totalItems) * 100)
    : 0;
  const continueCourse =
    courses.find((course) => course.activeAttemptId) ?? courses[0];
  const continueProgress = continueCourse ? courseProgress(continueCourse) : 0;
  const continueCourseName = continueCourse
    ? normaliseProductName(continueCourse.name)
    : "";
  const continueSubtitle = continueCourse
    ? continueCourse.activeTestTitle
      ? continueCourseName
      : meaningfulProductDescription(
          continueCourse.description,
          continueCourse.name,
          continueCourse.slug,
          `${continueCourse.materialCount} resources · ${continueCourse.testCount} tests`,
        )
    : "";
  const chartResults = [...recentResults].reverse();
  const average = recentResults.length
    ? Math.round(
        recentResults.reduce(
          (total, result) =>
            total +
            (Number(result.maxScore)
              ? (Number(result.score) / Number(result.maxScore)) * 100
              : 0),
          0,
        ) / recentResults.length,
      )
    : null;
  const firstName = auth.user.name.split(" ")[0];

  return (
    <WorkspaceShell
      admin={false}
      name={auth.user.name}
      email={auth.user.email}
      section="overview"
      unreadNotifications={notifications.unreadCount}
      mainClassName="student-dashboard-main"
    >
      <section className="relative isolate min-h-[15.5rem] overflow-hidden border-0 bg-[#fff8f3] min-[801px]:min-h-[18.5rem] max-[600px]:min-h-72">
        <div className="relative z-[2] w-[min(47%,31rem)] p-[2.2rem] max-[800px]:w-[62%] max-[800px]:p-6 max-[600px]:w-[68%] max-[600px]:px-5 max-[600px]:pt-[1.35rem] max-[600px]:pb-6 max-[560px]:w-[62%] max-[560px]:px-[0.85rem] max-[560px]:py-[1.2rem] max-[380px]:w-[66%] max-[380px]:px-3">
          <span className="text-[0.62rem] font-extrabold tracking-[0.12em] text-prep-orange">
            WELCOME BACK
          </span>
          <h1 className="my-[0.45rem] mb-[0.6rem] text-[clamp(1.65rem,3vw,2.55rem)] tracking-[-0.045em] text-[#202327] max-[600px]:text-[1.75rem] max-[560px]:text-[clamp(1.3rem,5vw,1.6rem)]">
            Keep learning, {firstName}!
          </h1>
          <p className="mt-0 mb-5 max-w-96 text-[0.8rem] leading-[1.6] text-[#666c71] max-[600px]:max-w-64 max-[560px]:text-[0.74rem] max-[560px]:leading-[1.4]">
            Pick up where you left off and keep moving towards your goals.
          </p>
          {continueCourse ? (
            <Link
              className="inline-flex items-center gap-[0.6rem] rounded-[0.35rem] bg-prep-orange px-4 py-[0.7rem] text-[0.72rem] font-[750] text-white"
              href={
                continueCourse.activeAttemptId
                  ? `/attempts/${continueCourse.activeAttemptId}?course=${continueCourse.slug}`
                  : `/dashboard/courses/${continueCourse.slug}`
              }
            >
              Continue learning <b>→</b>
            </Link>
          ) : (
            <Link
              className="inline-flex items-center gap-[0.6rem] rounded-[0.35rem] bg-prep-orange px-4 py-[0.7rem] text-[0.72rem] font-[750] text-white"
              href="/packages"
            >
              Explore packages <b>→</b>
            </Link>
          )}
        </div>
        <StudentHeroCarousel />
      </section>

      <div className="mx-auto w-full max-w-[1240px] px-[clamp(1.25rem,3vw,2.5rem)] pt-8 pb-16 max-[700px]:px-4 max-[700px]:pt-6 max-[700px]:pb-12">
        {continueCourse ? (
          <section className="mt-[1.65rem]">
            <div className="mb-[.8rem] flex items-center justify-between gap-4">
              <h2 className="m-0 text-[1.22rem] tracking-[-.02em] text-[#24282b]">
                Continue learning
              </h2>
              <Link
                className="text-[.8rem] font-bold text-prep-orange"
                href={`/dashboard/courses/${continueCourse.slug}`}
              >
                View package
              </Link>
            </div>
            <article className="grid grid-cols-[5.1rem_minmax(0,1fr)_minmax(12rem,20rem)] items-center gap-4 rounded-[.55rem] border border-[#e4e2de] bg-white p-[.8rem] max-[800px]:grid-cols-[4.5rem_minmax(0,1fr)] max-[600px]:grid-cols-[3.7rem_minmax(0,1fr)]">
              <div className="relative grid h-[4.4rem] w-[5.1rem] place-items-center overflow-hidden rounded-[.35rem] bg-[linear-gradient(135deg,#164a5c,#ee6b3b)] text-white max-[600px]:size-[3.7rem] [&>img]:object-cover">
                {continueCourse.coverObjectKey ? (
                  <ProductCoverImage
                    productId={continueCourse.id}
                    alt=""
                    sizes="88px"
                    fallback={
                      <b>{continueCourseName.slice(0, 2).toUpperCase()}</b>
                    }
                  />
                ) : (
                  <b>{continueCourseName.slice(0, 2).toUpperCase()}</b>
                )}
              </div>
              <div className="min-w-0">
                <small className="text-[.75rem] font-extrabold tracking-[.08em] text-prep-orange">
                  {continueCourse.activeAttemptId
                    ? "TEST IN PROGRESS"
                    : "YOUR PACKAGE"}
                </small>
                <h3 className="my-[.28rem] text-[.9rem]">
                  {continueCourse.activeTestTitle ?? continueCourseName}
                </h3>
                <p className="m-0 text-[.68rem] text-prep-muted">
                  {continueSubtitle}
                </p>
              </div>
              <div className="grid grid-cols-[1fr_auto] items-center gap-x-[.8rem] gap-y-[.38rem] max-[800px]:col-span-full">
                <span className="text-[.63rem] text-prep-muted">
                  {continueProgress}% complete
                </span>
                <progress
                  className="h-[.34rem] w-full overflow-hidden rounded-full border-0 bg-[#eee] [&::-moz-progress-bar]:bg-[#ef4c18] [&::-webkit-progress-bar]:bg-[#eee] [&::-webkit-progress-value]:bg-[#ef4c18]"
                  max="100"
                  value={continueProgress}
                />
                <Link
                  className="col-start-2 row-span-2 row-start-1 flex items-center gap-[.45rem] rounded-[.32rem] border border-prep-orange px-[.8rem] py-[.55rem] text-[.68rem] font-bold text-prep-orange"
                  href={
                    continueCourse.activeAttemptId
                      ? `/attempts/${continueCourse.activeAttemptId}?course=${continueCourse.slug}`
                      : `/dashboard/courses/${continueCourse.slug}`
                  }
                >
                  Continue <b>→</b>
                </Link>
              </div>
            </article>
          </section>
        ) : null}

        <section
          className="mt-5 grid grid-cols-4 gap-3 max-[1050px]:grid-cols-2 max-[600px]:grid-cols-1"
          aria-label="Learning overview"
        >
          <article className="flex items-center gap-3 rounded-lg border border-[#e6e4e1] bg-white p-4">
            <i className="grid size-[2.45rem] place-items-center rounded-[.45rem] bg-[#fff0e7] text-[#e84a17]">
              <DashboardIcon name="package" />
            </i>
            <div className="grid">
              <strong className="text-xl">{courses.length}</strong>
              <span className="text-[.75rem] text-prep-muted">
                Active packages
              </span>
            </div>
          </article>
          <article className="flex items-center gap-3 rounded-lg border border-[#e6e4e1] bg-white p-4">
            <i className="grid size-[2.45rem] place-items-center rounded-[.45rem] bg-[#eaf5f2] text-[#28846a]">
              <DashboardIcon name="progress" />
            </i>
            <div className="grid">
              <strong className="text-xl">{progress}%</strong>
              <span className="text-[.75rem] text-prep-muted">
                Overall progress
              </span>
            </div>
          </article>
          <article className="flex items-center gap-3 rounded-lg border border-[#e6e4e1] bg-white p-4">
            <i className="grid size-[2.45rem] place-items-center rounded-[.45rem] bg-[#eef0fb] text-[#5764ad]">
              <DashboardIcon name="test" />
            </i>
            <div className="grid">
              <strong className="text-xl">{completedAttempts}</strong>
              <span className="text-[.75rem] text-prep-muted">
                Tests attempted
              </span>
            </div>
          </article>
          <article className="flex items-center gap-3 rounded-lg border border-[#e6e4e1] bg-white p-4">
            <i className="grid size-[2.45rem] place-items-center rounded-[.45rem] bg-[#fff6dc] text-[#b38212]">
              <DashboardIcon name="bell" />
            </i>
            <div className="grid">
              <strong className="text-xl">{summary.unreadNotifications}</strong>
              <span className="text-[.75rem] text-prep-muted">
                Unread updates
              </span>
            </div>
          </article>
        </section>

        <section className="mt-[1.65rem]">
          <div className="mb-[.8rem] flex items-center justify-between gap-4">
            <h2 className="m-0 text-[1.22rem] tracking-[-.02em] text-[#24282b]">
              My packages
            </h2>
            <Link
              className="text-[.8rem] font-bold text-prep-orange"
              href="/dashboard/courses"
            >
              View all <span>→</span>
            </Link>
          </div>
          {courses.length ? (
            <div className="grid rounded-lg border border-[#e5e3df] bg-white">
              {courses.slice(0, 3).map((course) => {
                const courseName = normaliseProductName(course.name);
                return (
                  <Link
                    className="grid grid-cols-[3.7rem_minmax(0,1fr)_auto] items-center gap-[.85rem] border-t border-[#eceae7] p-3 first:border-t-0"
                    href={`/dashboard/courses/${course.slug}`}
                    key={course.id}
                  >
                    <span className="relative grid h-12 w-[3.7rem] place-items-center overflow-hidden rounded-[.3rem] bg-[linear-gradient(135deg,#1d4f62,#ed6a3a)] text-[.68rem] font-extrabold text-white [&>img]:object-cover">
                      {course.coverObjectKey ? (
                        <ProductCoverImage
                          productId={course.id}
                          alt=""
                          sizes="64px"
                          fallback={courseName.slice(0, 2).toUpperCase()}
                        />
                      ) : (
                        courseName.slice(0, 2).toUpperCase()
                      )}
                    </span>
                    <div className="grid min-w-0 gap-1">
                      <strong className="text-[.9rem]">{courseName}</strong>
                      <small className="text-[.75rem] text-prep-muted">
                        {course.materialCount} materials · {course.testCount}{" "}
                        tests
                      </small>
                    </div>
                    <b className="text-[.65rem] text-prep-orange">
                      {course.activeAttemptId ? "Continue" : "Open"} →
                    </b>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#ddd8d3] p-8 text-center text-prep-muted [&_a]:font-bold [&_a]:text-prep-orange">
              <p>No active packages yet.</p>
              <Link href="/packages">Explore packages</Link>
            </div>
          )}
        </section>

        <div className="mt-[1.65rem] grid grid-cols-[minmax(0,1.25fr)_minmax(18rem,.75fr)] gap-[.9rem] max-[1050px]:grid-cols-1">
          <section className="min-w-0 rounded-[.55rem] border border-[#e4e2df] bg-white p-4">
            <div className="mb-[.8rem] flex items-center justify-between gap-4">
              <div>
                <h2 className="m-0 text-[1.22rem] tracking-[-.02em] text-[#24282b]">
                  Recent performance
                </h2>
                <p className="mt-1 mb-0 text-[.83rem] text-prep-muted">
                  {average === null
                    ? "Complete a test to see your progress"
                    : `Average score ${average}%`}
                </p>
              </div>
              {summary.latestResultId ? (
                <Link
                  className="text-[.8rem] font-bold text-prep-orange"
                  href={`/results/${summary.latestResultId}?course=${summary.latestResultCourseSlug}`}
                >
                  View analysis
                </Link>
              ) : null}
            </div>
            {chartResults.length ? (
              <div
                className="flex h-[10.5rem] items-end gap-[clamp(.8rem,4vw,2.4rem)] border-b border-l border-[#eee] bg-[repeating-linear-gradient(to_bottom,#f0efed_0,#f0efed_1px,transparent_1px,transparent_25%)] px-4 pt-4 pb-6"
                aria-label="Recent test scores"
              >
                {chartResults.map((result) => {
                  const value = Number(result.maxScore)
                    ? Math.round(
                        (Number(result.score) / Number(result.maxScore)) * 100,
                      )
                    : 0;
                  return (
                    <div
                      className="relative flex h-full w-[2.1rem] items-end justify-center"
                      key={result.id}
                    >
                      <span
                        className="block min-h-2 w-full rounded-t bg-[linear-gradient(#ff885c,#eb4814)]"
                        title={`${result.title}: ${value}%`}
                        style={{ height: `${Math.max(8, value)}%` }}
                      />
                      <small className="absolute -bottom-5 text-[.55rem] text-[#767b80]">
                        {value}%
                      </small>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-[10.5rem] items-end gap-4 border-b border-[#eee] p-4 [&>span]:h-[15%] [&>span]:w-8 [&>span]:rounded-t [&>span]:bg-[#eee]">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            )}
          </section>
          <section className="min-w-0 rounded-[.55rem] border border-[#e4e2df] bg-white p-4">
            <div className="mb-[.8rem] flex items-center justify-between gap-4">
              <h2 className="m-0 text-[1.22rem] tracking-[-.02em] text-[#24282b]">
                Notifications
              </h2>
              <Link
                className="text-[.8rem] font-bold text-prep-orange"
                href="/dashboard/notifications"
              >
                View all
              </Link>
            </div>
            <div className="grid">
              {notifications.items.slice(0, 3).map((item, index) => (
                <Link
                  className="grid grid-cols-[2.3rem_minmax(0,1fr)_auto] items-center gap-[.65rem] border-t border-[#eeece9] py-[.65rem] first:border-t-0"
                  href="/dashboard/notifications"
                  key={item.id}
                >
                  <i
                    className={`grid size-[2.1rem] place-items-center rounded-full ${index % 3 === 0 ? "bg-[#fff0e8] text-prep-orange" : index % 3 === 1 ? "bg-[#ebf5f2] text-[#278169]" : "bg-[#eef0fb] text-[#5965ad]"}`}
                  >
                    <DashboardIcon
                      name={
                        index % 3 === 0
                          ? "bell"
                          : index % 3 === 1
                            ? "test"
                            : "package"
                      }
                    />
                  </i>
                  <div className="grid min-w-0 gap-[.18rem]">
                    <strong className="text-[.9rem]">{item.title}</strong>
                    <small className="overflow-hidden text-[.75rem] text-ellipsis whitespace-nowrap text-[#858a8e]">
                      {item.body}
                    </small>
                  </div>
                  {!item.readAt ? (
                    <b
                      className="size-[.38rem] rounded-full bg-[#ea4815]"
                      aria-label="Unread"
                    />
                  ) : null}
                </Link>
              ))}
              {!notifications.items.length ? (
                <p>No new notifications.</p>
              ) : null}
            </div>
          </section>
        </div>

        <section className="mt-[1.65rem]">
          <div className="mb-[.8rem] flex items-center justify-between gap-4">
            <h2 className="m-0 text-[1.22rem] tracking-[-.02em] text-[#24282b]">
              Quick links
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-[.8rem] max-[600px]:grid-cols-1">
            <Link
              className="grid grid-cols-[2.6rem_minmax(0,1fr)_auto] items-center gap-[.7rem] rounded-lg border border-[#e5e3e0] bg-white p-[.85rem]"
              href="/packages"
            >
              <i className="grid size-[2.45rem] place-items-center rounded-[.42rem] bg-[#fff0e8] text-[#e64916]">
                <DashboardIcon name="explore" />
              </i>
              <span className="grid gap-1">
                <b className="text-[.9rem]">Explore packages</b>
                <small className="text-[.75rem] text-prep-muted">
                  Find your next learning package
                </small>
              </span>
              <strong className="text-prep-orange">→</strong>
            </Link>
            <Link
              className="grid grid-cols-[2.6rem_minmax(0,1fr)_auto] items-center gap-[.7rem] rounded-lg border border-[#e5e3e0] bg-white p-[.85rem]"
              href="/dashboard/orders"
            >
              <i className="grid size-[2.45rem] place-items-center rounded-[.42rem] bg-[#ebf5f2] text-[#287f69]">
                <DashboardIcon name="order" />
              </i>
              <span className="grid gap-1">
                <b className="text-[.9rem]">My orders</b>
                <small className="text-[.75rem] text-prep-muted">
                  View payments and receipts
                </small>
              </span>
              <strong className="text-prep-orange">→</strong>
            </Link>
            <Link
              className="grid grid-cols-[2.6rem_minmax(0,1fr)_auto] items-center gap-[.7rem] rounded-lg border border-[#e5e3e0] bg-white p-[.85rem]"
              href="/dashboard/support"
            >
              <i className="grid size-[2.45rem] place-items-center rounded-[.42rem] bg-[#eef0fb] text-[#5966ad]">
                <DashboardIcon name="support" />
              </i>
              <span className="grid gap-1">
                <b className="text-[.9rem]">Support</b>
                <small className="text-[.75rem] text-prep-muted">
                  Get help from our team
                </small>
              </span>
              <strong className="text-prep-orange">→</strong>
            </Link>
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}
