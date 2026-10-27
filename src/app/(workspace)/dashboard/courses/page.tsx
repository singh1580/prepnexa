import { ProductCoverImage } from "@/components/product-cover-image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentNotifications } from "@/features/operations/service";
import { getOwnedStudentCourses } from "@/features/student-courses/service";
import { courseProgress } from "@/features/student-courses/progress";
import {
  meaningfulProductDescription,
  normaliseProductName,
} from "@/features/catalog/presentation";

export const metadata = { title: "My packages" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const query = await searchParams;
  const status = query.status === "expired" ? "expired" : "active";
  const search = (query.q ?? "").trim().toLowerCase();
  const [allCourses, notifications] = await Promise.all([
    getOwnedStudentCourses(auth.user.id),
    getStudentNotifications(auth.user.id),
  ]);
  const courses = allCourses.filter(
    (course) =>
      (status === "active"
        ? course.accessStatus === "ACTIVE"
        : course.accessStatus === "EXPIRED") &&
      (!search ||
        course.name.toLowerCase().includes(search) ||
        (course.description ?? "").toLowerCase().includes(search)),
  );
  const activeCount = allCourses.filter(
    (course) => course.accessStatus === "ACTIVE",
  ).length;
  const expiredCount = allCourses.length - activeCount;
  return (
    <WorkspaceShell
      admin={false}
      name={auth.user.name}
      email={auth.user.email}
      userId={auth.user.id}
      section="courses"
      unreadNotifications={notifications.unreadCount}
      navigationPackages={allCourses.filter(
        (course) => course.accessStatus === "ACTIVE",
      )}
    >
      <header className="mb-[1.1rem] flex items-center justify-between gap-5 max-[700px]:flex-col max-[700px]:items-stretch max-[700px]:gap-[.8rem]">
        <div className="min-w-0">
          <h1 className="mt-0 mb-[.3rem] text-[clamp(1.65rem,2.4vw,2.25rem)] leading-[1.08] tracking-[-.04em] break-words">
            My Packages
          </h1>
          <p className="m-0 max-w-3xl text-[.88rem] text-[#687077]">
            Access all your purchased learning packages in one place.
          </p>
        </div>
        <Link
          className="rounded-[.35rem] border border-prep-orange px-[.9rem] py-[.65rem] text-[.8rem] font-bold text-prep-orange max-[700px]:text-center"
          href="/packages"
        >
          Explore packages <span>→</span>
        </Link>
      </header>
      <form
        className="mb-[1.1rem] flex items-center justify-between gap-4 border-b border-[#e7e5e2] max-[700px]:flex-col max-[700px]:items-stretch"
        role="search"
      >
        <label className="mb-[.65rem] flex h-10 w-[min(25rem,45%)] items-center rounded-[.35rem] border border-[#dddcd9] px-3 max-[700px]:m-0 max-[700px]:w-full">
          <svg
            className="size-4 fill-none stroke-[#777d82] stroke-[1.7]"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            className="w-full border-0 bg-transparent text-[.7rem] outline-none"
            name="q"
            defaultValue={query.q}
            aria-label="Search your packages"
            placeholder="Search your packages..."
          />
        </label>
        <nav
          className="flex self-stretch gap-6 overflow-x-auto max-[700px]:min-h-[2.7rem] max-[700px]:w-full"
          aria-label="Package status"
        >
          <Link
            className={`flex items-center gap-[.4rem] whitespace-nowrap border-b-2 text-[.7rem] ${status === "active" ? "border-prep-orange text-prep-orange" : "border-transparent text-prep-muted"}`}
            href={`/dashboard/courses${query.q ? `?q=${encodeURIComponent(query.q)}` : ""}`}
          >
            Active{" "}
            <b className="rounded-full bg-[#f2f1ef] px-[.35rem] py-[.12rem] text-[.55rem]">
              {activeCount}
            </b>
          </Link>
          <Link
            className={`flex items-center gap-[.4rem] whitespace-nowrap border-b-2 text-[.7rem] ${status === "expired" ? "border-prep-orange text-prep-orange" : "border-transparent text-prep-muted"}`}
            href={`/dashboard/courses?status=expired${query.q ? `&q=${encodeURIComponent(query.q)}` : ""}`}
          >
            Expired{" "}
            <b className="rounded-full bg-[#f2f1ef] px-[.35rem] py-[.12rem] text-[.55rem]">
              {expiredCount}
            </b>
          </Link>
        </nav>
      </form>
      {courses.length ? (
        <div className="grid grid-cols-3 gap-4 max-[1050px]:grid-cols-2 max-[700px]:grid-cols-1">
          {courses.map((course) => {
            const completion = courseProgress(course);
            const courseName = normaliseProductName(course.name);
            const description = meaningfulProductDescription(
              course.description,
              course.name,
              course.slug,
              "Structured study materials, tests and detailed results in one package.",
            );
            return (
              <article
                className="overflow-hidden rounded-[.55rem] border border-[#e1dfdc] bg-white shadow-[0_.5rem_1.5rem_#3c302709]"
                key={course.id}
              >
                <div className="relative flex min-h-40 items-end overflow-hidden bg-[linear-gradient(135deg,#164b5e,#ef7340)] p-4 text-white max-[560px]:min-h-36 [&>img]:object-cover">
                  {course.coverObjectKey ? (
                    <ProductCoverImage
                      productId={course.id}
                      alt={`${courseName} cover`}
                      sizes="(max-width: 700px) 100vw, 360px"
                      fallback={
                        <strong className="relative z-[1] ml-auto text-[2.4rem]">
                          {courseName.slice(0, 2).toUpperCase()}
                        </strong>
                      }
                    />
                  ) : (
                    <>
                      <span className="relative z-[1] self-start text-[.6rem] font-extrabold">
                        Prepstore
                      </span>
                      <strong className="relative z-[1] ml-auto text-[2.4rem]">
                        {courseName.slice(0, 2).toUpperCase()}
                      </strong>
                    </>
                  )}
                  <b
                    className={`absolute top-[.7rem] right-[.7rem] z-[2] rounded-full px-[.45rem] py-1 text-[.55rem] ${course.accessStatus === "EXPIRED" ? "bg-[#f0efed] text-[#73777b]" : "bg-[#e7f4ed] text-[#237255]"}`}
                  >
                    {course.accessStatus === "EXPIRED" ? "Expired" : "Active"}
                  </b>
                </div>
                <div className="p-4 max-[700px]:p-3">
                  <h2 className="m-0 text-[.9rem]">{courseName}</h2>
                  <p className="my-[.45rem] min-h-0 text-[.75rem] leading-[1.55] text-[#777d82] min-[701px]:min-h-[2.4rem]">
                    {description}
                  </p>
                  <div className="flex gap-4 border-y border-[#eceae7] py-[.7rem] text-[.75rem] text-[#63696e]">
                    <span>{course.materialCount} resources</span>
                    <span>{course.testCount} tests</span>
                  </div>
                  <div className="my-[.8rem]">
                    <div className="mb-[.35rem] flex justify-between text-[.75rem] text-[#6d7378]">
                      <span>Progress</span>
                      <b>{completion}%</b>
                    </div>
                    <progress
                      className="h-[.3rem] w-full overflow-hidden rounded-full border-0 [&::-moz-progress-bar]:bg-[#eb4814] [&::-webkit-progress-bar]:bg-[#eee] [&::-webkit-progress-value]:bg-[#eb4814]"
                      max="100"
                      value={completion}
                    />
                  </div>
                  {course.accessStatus === "ACTIVE" ? (
                    <Link
                      className="flex justify-center gap-2 rounded-[.32rem] bg-[#eb4814] p-[.65rem] text-[.68rem] font-bold text-white"
                      href={`/dashboard/courses/${course.slug}`}
                    >
                      {course.activeAttemptId
                        ? "Continue learning"
                        : "Open package"}{" "}
                      <span>→</span>
                    </Link>
                  ) : (
                    <span className="block rounded-[.32rem] border border-[#dedbd7] p-[.65rem] text-center text-[.62rem] text-[#777d82]">
                      Access expired{" "}
                      {course.expiresAt
                        ? `on ${new Date(course.expiresAt).toLocaleDateString("en-IN")}`
                        : ""}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className="rounded-lg border border-dashed border-[#ddd8d3] p-8 text-center text-prep-muted [&_a]:font-bold [&_a]:text-prep-orange">
          <h2>No {status} packages found</h2>
          <p>
            {search
              ? "Try a different search term."
              : status === "active"
                ? "Your active purchased packages will appear here."
                : "Expired packages will appear here."}
          </p>
          {status === "active" ? (
            <Link href="/packages">Explore packages</Link>
          ) : null}
        </section>
      )}
    </WorkspaceShell>
  );
}
