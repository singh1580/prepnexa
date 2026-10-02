import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentMaterial } from "@/features/materials/service";
import { AppError } from "@/lib/errors/app-error";
import { getStudentCourse } from "@/features/student-courses/service";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ course?: string }>;
}) {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const parsed = z.uuid().safeParse((await params).id);
  if (!parsed.success) notFound();
  let material: Awaited<ReturnType<typeof getStudentMaterial>>;
  try {
    material = await getStudentMaterial(parsed.data, auth.user.id);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  const courseSlug = (await searchParams).course;
  const courseHref = courseSlug ? `/dashboard/courses/${encodeURIComponent(courseSlug)}?view=materials` : "/dashboard/courses";
  const course = courseSlug ? await getStudentCourse(courseSlug, auth.user.id) : null;
  const activeIndex=course?.materials.findIndex(item=>item.id===material.id)??-1;
  const nextMaterial=course&&activeIndex>=0?course.materials[activeIndex+1]:undefined;
  const subjectGroups=course?Array.from(new Set(course.materials.map(item=>item.subject))).map(subject=>({subject,items:course.materials.filter(item=>item.subject===subject)})):[];
  const activeCourseMaterial=course?.materials.find(item=>item.id===material.id);
  return (
    <WorkspaceShell
      admin={false}
      name={auth.user.name}
      permissions={auth.permissions}
      section="courses"
    >
      <nav className="student-breadcrumb" aria-label="Breadcrumb"><Link href="/dashboard/courses">My Packages</Link><span>›</span>{course?<Link href={courseHref}>{course.name}</Link>:null}<span>›</span>{activeCourseMaterial?<span>{activeCourseMaterial.subject}</span>:null}<span>›</span><b>{material.title}</b></nav>
      <div className="lesson-layout reference-reader-layout">{course?<details className="course-outline" open><summary><b>⌄ &nbsp; Course Outline</b><span aria-label="Close course outline">×</span></summary><nav>{subjectGroups.map((group,groupIndex)=><details className="outline-subject" open={group.items.some(item=>item.id===material.id)} key={group.subject}><summary><span>{groupIndex+1}. {group.subject}</span><small>{group.items.filter(item=>item.viewed).length}/{group.items.length}</small></summary>{group.items.map((item,index)=><Link className={item.id===material.id?"active":""} href={`/library/${item.id}?course=${encodeURIComponent(course.slug)}`} key={item.id}><i className={item.id===material.id?"current":item.viewed?"done":""}>{item.id===material.id?"○":item.viewed?"✓":""}</i><div><strong>{groupIndex+1}.{index+1} {item.title}</strong><small>{item.type}{item.sizeBytes?` · ${Math.ceil(item.sizeBytes/1024)} KB`:""}</small></div></Link>)}</details>)}</nav></details>:null}<div className="lesson-content">
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
        <section className="material-reader"><header className="reader-heading"><div><i>⌑</i><div><h1>{material.originalFileName??material.title}</h1><p>{material.examName} · {material.type}</p></div></div>{nextMaterial?<Link className="button" href={`/library/${nextMaterial.id}?course=${encodeURIComponent(course?.slug??"")}`}>Next lesson →</Link>:<Link className="button secondary" href={courseHref}>Back to materials</Link>}</header>
          <div className="panel material-reader-toolbar">
            <div>
              <strong>Secure document viewer</strong><small>{material.sizeBytes?`${(material.sizeBytes/1024/1024).toFixed(2)} MB`:`Version ${material.version}`}</small>
            </div>
            {material.allowDownload ? (
              <a
                className="button secondary"
                href={`/api/materials/${material.id}/access?action=download`}
              >
                Download protected copy
              </a>
            ) : (
              <span className="quiet-tag">Online viewing only</span>
            )}
          </div>
          {material.contentType === "application/pdf" ? (
            <iframe
              title={material.title}
              src={`/api/materials/${material.id}/access?action=view`}
              className="pdf-reader"
            />
          ) : material.allowDownload ? (
            <section className="panel empty-state">
              <h2>Ready to download</h2>
              <p>
                This file type is delivered as a protected download after every
                access check.
              </p>
              <a
                className="button"
                href={`/api/materials/${material.id}/access?action=download`}
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
      </div></div>
    </WorkspaceShell>
  );
}
