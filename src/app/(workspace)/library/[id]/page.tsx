import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentMaterial } from "@/features/materials/service";
import { AppError } from "@/lib/errors/app-error";
import { getStudentCourse } from "@/features/student-courses/service";
import { UiIcon } from "@/components/ui-icon";
import { normaliseProductName } from "@/features/catalog/presentation";
import { SecurePdfViewer } from "@/features/materials/ui/secure-pdf-viewer";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ course?: string }>;
}) {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const courseSlug = (await searchParams).course;
  const parsed = z.uuid().safeParse((await params).id);
  if (!parsed.success) notFound();
  let material: Awaited<ReturnType<typeof getStudentMaterial>>;
  try {
    material = await getStudentMaterial(parsed.data, auth.user.id, courseSlug);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  const courseHref = courseSlug
    ? `/dashboard/courses/${encodeURIComponent(courseSlug)}?view=materials`
    : "/dashboard/courses";
  const course = courseSlug
    ? await getStudentCourse(courseSlug, auth.user.id)
    : null;
  const activeIndex =
    course?.materials.findIndex((item) => item.id === material.id) ?? -1;
  const nextMaterial =
    course && activeIndex >= 0 ? course.materials[activeIndex + 1] : undefined;
  return (
    <WorkspaceShell
      admin={false}
      name={auth.user.name}
      email={auth.user.email}
      permissions={auth.permissions}
      section="courses"
      activePackageSlug={courseSlug}
      activePackageView="materials"
      activeMaterialId={material.id}
    >
      <nav
        className="mb-3 flex max-w-full flex-wrap items-center gap-x-[.45rem] gap-y-[.32rem] text-[.68rem] leading-[1.35] text-prep-muted [&_a:hover]:text-prep-orange"
        aria-label="Breadcrumb"
      >
        <Link href="/dashboard">Dashboard</Link>
        <span>›</span>
        <Link href="/dashboard/courses">My Packages</Link>
        <span>›</span>
        {course ? (
          <Link href={courseHref}>{normaliseProductName(course.name)}</Link>
        ) : null}
        <span>›</span>
        <Link href={courseHref}>Study materials</Link>
        <span>›</span>
        <b
          className="min-w-0 max-w-full break-words text-[#44494e]"
          aria-current="page"
        >
          {material.title}
        </b>
      </nav>
      <div className="min-w-0 max-w-full">
        {material.type === "VIDEO" ? (
          <section className="grid min-h-80 place-items-center gap-3 rounded-xl border border-[#e3e1de] bg-white p-8 text-center">
            <span
              className="grid size-16 place-items-center rounded-full bg-[#fff0e8] text-2xl text-[#e84916]"
              aria-hidden="true"
            >
              ▶
            </span>
            <h2 className="m-0">Video lesson</h2>
            <p className="m-0 text-[.82rem] text-[#687077]">
              This lesson opens on its secure source in a new tab.
            </p>
            <a
              className="inline-flex min-h-10 items-center justify-center rounded-[.4rem] bg-prep-orange px-4 py-2 text-[.75rem] font-bold text-white hover:bg-prep-orange-dark"
              href={material.body ?? "#"}
              target="_blank"
              rel="noreferrer"
            >
              Open video
            </a>
          </section>
        ) : (
          <section className="w-full min-w-0 max-w-full overflow-hidden">
            <header className="flex min-w-0 max-w-full items-center justify-between gap-4 rounded-t-[.45rem] border border-[#dedcd8] bg-white px-3 py-[.65rem] max-[700px]:flex-col max-[700px]:items-stretch max-[700px]:gap-[.65rem] max-[700px]:p-3">
              <div className="flex min-w-0 max-w-full items-center gap-[.7rem] max-[700px]:items-start">
                <i className="grid size-8 shrink-0 place-items-center rounded-[.35rem] bg-[#ef4b17] text-white not-italic [&_svg]:size-4">
                  <UiIcon name="document" />
                </i>
                <div className="min-w-0 max-w-full max-[700px]:w-[calc(100%-2.7rem)]">
                  <h1 className="m-0 text-[.9rem] leading-[1.35] break-words [overflow-wrap:anywhere] max-[700px]:text-[.85rem]">
                    {material.originalFileName ?? material.title}
                  </h1>
                  <p className="mt-[.15rem] mb-0 text-[.65rem] text-prep-muted">
                    {material.examName} · {material.type}
                  </p>
                </div>
              </div>
              {nextMaterial ? (
                <Link
                  className="inline-flex min-h-[2.2rem] shrink-0 items-center justify-center rounded-[.38rem] bg-prep-orange px-3 py-[.45rem] text-[.68rem] font-bold text-white hover:bg-prep-orange-dark max-[700px]:w-full"
                  href={`/library/${nextMaterial.id}?course=${encodeURIComponent(course?.slug ?? "")}`}
                >
                  Next lesson →
                </Link>
              ) : (
                <Link
                  className="inline-flex min-h-[2.2rem] shrink-0 items-center justify-center rounded-[.38rem] border border-[#c8c9ca] bg-white px-3 py-[.45rem] text-[.68rem] font-bold text-[#4d5459] hover:bg-[#f5f5f4] max-[700px]:w-full"
                  href={courseHref}
                >
                  Back to materials
                </Link>
              )}
            </header>
            <div className="flex min-h-14 w-full max-w-full items-center gap-4 border-x border-b border-[#dedcd8] bg-white px-3 py-[.65rem] max-[520px]:items-start max-[520px]:flex-col max-[520px]:gap-2">
              <div className="grid min-w-0 gap-[.08rem]">
                <strong className="text-[.82rem]">
                  Secure document viewer
                </strong>
                <small className="text-[.68rem] text-prep-muted">
                  {material.sizeBytes
                    ? `${(material.sizeBytes / 1024 / 1024).toFixed(2)} MB`
                    : `Version ${material.version}`}
                </small>
              </div>
              {material.allowDownload ? (
                <a
                  className="ml-auto inline-flex min-h-9 shrink-0 items-center justify-center rounded-[.38rem] border border-[#c8c9ca] bg-white px-3 py-2 text-[.68rem] font-bold text-[#4d5459] hover:bg-[#f5f5f4] max-[520px]:ml-0 max-[520px]:w-full"
                  href={`/api/materials/${material.id}/access?action=download${courseSlug ? `&course=${encodeURIComponent(courseSlug)}` : ""}`}
                >
                  Download protected copy
                </a>
              ) : (
                <span className="ml-auto inline-flex shrink-0 rounded-full bg-[#eff3f6] px-[.55rem] py-[.35rem] text-[.62rem] font-semibold whitespace-nowrap text-[#4f6478] max-[520px]:ml-0">
                  Personal study copy · access protected
                </span>
              )}
            </div>
            {material.contentType === "application/pdf" ? (
              <SecurePdfViewer
                title={material.title}
                src={`/api/materials/${material.id}/access?action=view${courseSlug ? `&course=${encodeURIComponent(courseSlug)}` : ""}`}
              />
            ) : material.allowDownload ? (
              <section className="grid min-h-80 place-items-center gap-3 rounded-b-xl border border-t-0 border-[#e3e1de] bg-white p-8 text-center">
                <h2 className="m-0">Ready to download</h2>
                <p className="m-0 max-w-xl text-[.82rem] leading-relaxed text-[#687077]">
                  This file type is delivered as a protected download after
                  every access check.
                </p>
                <a
                  className="inline-flex min-h-10 items-center justify-center rounded-[.4rem] bg-prep-orange px-4 py-2 text-[.75rem] font-bold text-white hover:bg-prep-orange-dark"
                  href={`/api/materials/${material.id}/access?action=download${courseSlug ? `&course=${encodeURIComponent(courseSlug)}` : ""}`}
                >
                  Download file
                </a>
              </section>
            ) : (
              <section className="grid min-h-80 place-items-center gap-3 rounded-b-xl border border-t-0 border-[#e3e1de] bg-white p-8 text-center">
                <h2 className="m-0">Download disabled</h2>
                <p className="m-0 max-w-xl text-[.82rem] leading-relaxed text-[#687077]">
                  This resource is currently available for online PDF reading
                  only.
                </p>
              </section>
            )}
          </section>
        )}
      </div>
    </WorkspaceShell>
  );
}
