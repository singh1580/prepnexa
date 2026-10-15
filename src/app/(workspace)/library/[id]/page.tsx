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
  const courseHref = courseSlug ? `/dashboard/courses/${encodeURIComponent(courseSlug)}?view=materials` : "/dashboard/courses";
  const course = courseSlug ? await getStudentCourse(courseSlug, auth.user.id) : null;
  const activeIndex=course?.materials.findIndex(item=>item.id===material.id)??-1;
  const nextMaterial=course&&activeIndex>=0?course.materials[activeIndex+1]:undefined;
  return (
    <WorkspaceShell
      admin={false}
      name={auth.user.name} email={auth.user.email}
      permissions={auth.permissions}
      section="courses"
      activePackageSlug={courseSlug}
      activePackageView="materials"
      activeMaterialId={material.id}
    >
      <nav className="student-breadcrumb" aria-label="Breadcrumb"><Link href="/dashboard">Dashboard</Link><span>›</span><Link href="/dashboard/courses">My Packages</Link><span>›</span>{course?<Link href={courseHref}>{normaliseProductName(course.name)}</Link>:null}<span>›</span><Link href={courseHref}>Study materials</Link><span>›</span><b aria-current="page">{material.title}</b></nav>
      <div className="lesson-content reference-reader-content">
      {material.type === "VIDEO" ? (
        <section className="panel video-lesson">
          <span className="video-placeholder" aria-hidden="true">▶</span><h2>Video lesson</h2>
          <p>This lesson opens on its secure source in a new tab.</p>
          <a
            className="button"
            href={material.body ?? "#"}
            target="_blank"
            rel="noreferrer"
          >
            Open video
          </a>
        </section>
      ) : (
        <section className="material-reader"><header className="reader-heading"><div><i><UiIcon name="document" /></i><div><h1>{material.originalFileName??material.title}</h1><p>{material.examName} · {material.type}</p></div></div>{nextMaterial?<Link className="button" href={`/library/${nextMaterial.id}?course=${encodeURIComponent(course?.slug??"")}`}>Next lesson →</Link>:<Link className="button secondary" href={courseHref}>Back to materials</Link>}</header>
          <div className="panel material-reader-toolbar">
            <div>
              <strong>Secure document viewer</strong><small>{material.sizeBytes?`${(material.sizeBytes/1024/1024).toFixed(2)} MB`:`Version ${material.version}`}</small>
            </div>
            {material.allowDownload ? (
              <a
                className="button secondary"
                href={`/api/materials/${material.id}/access?action=download${courseSlug?`&course=${encodeURIComponent(courseSlug)}`:""}`}
              >
                Download protected copy
              </a>
            ) : (
              <span className="quiet-tag">Online viewing only</span>
            )}
          </div>
          {material.contentType === "application/pdf" ? (
            <SecurePdfViewer title={material.title} src={`/api/materials/${material.id}/access?action=view${courseSlug?`&course=${encodeURIComponent(courseSlug)}`:""}`}/>
          ) : material.allowDownload ? (
            <section className="panel empty-state">
              <h2>Ready to download</h2>
              <p>
                This file type is delivered as a protected download after every
                access check.
              </p>
              <a
                className="button"
                href={`/api/materials/${material.id}/access?action=download${courseSlug?`&course=${encodeURIComponent(courseSlug)}`:""}`}
              >
                Download file
              </a>
            </section>
          ) : (
            <section className="panel empty-state">
              <h2>Download disabled</h2>
              <p>
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
