import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentNotifications } from "@/features/operations/service";
import { getOwnedStudentCourses } from "@/features/student-courses/service";

export const metadata = { title: "My packages" };

export default async function Page({searchParams}:{searchParams:Promise<{q?:string;status?:string}>}) {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const query=await searchParams;
  const status=query.status==="expired"?"expired":"active";
  const search=(query.q??"").trim().toLowerCase();
  const [allCourses,notifications]=await Promise.all([getOwnedStudentCourses(auth.user.id),getStudentNotifications(auth.user.id)]);
  const courses=allCourses.filter(course=>(status==="active"?course.accessStatus==="ACTIVE":course.accessStatus==="EXPIRED")&&(!search||course.name.toLowerCase().includes(search)||(course.description??"").toLowerCase().includes(search)));
  const activeCount=allCourses.filter(course=>course.accessStatus==="ACTIVE").length;
  const expiredCount=allCourses.length-activeCount;
  return <WorkspaceShell admin={false} name={auth.user.name} section="courses" unreadNotifications={notifications.unreadCount}>
    <header className="student-page-heading"><div><h1>My Packages</h1><p>Access all your purchased learning packages in one place.</p></div><Link href="/packages">Explore packages <span>→</span></Link></header>
    <form className="student-package-tools"><label><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input name="q" defaultValue={query.q} placeholder="Search your packages..."/></label><nav aria-label="Package status"><Link className={status==="active"?"active":""} href={`/dashboard/courses${query.q?`?q=${encodeURIComponent(query.q)}`:""}`}>Active <b>{activeCount}</b></Link><Link className={status==="expired"?"active":""} href={`/dashboard/courses?status=expired${query.q?`&q=${encodeURIComponent(query.q)}`:""}`}>Expired <b>{expiredCount}</b></Link></nav></form>
    {courses.length?<div className="student-package-grid">{courses.map(course=>{const completion=course.testCount?Math.min(100,Math.round(course.completedAttempts/course.testCount*100)):0;return <article key={course.id}><div className="student-package-image">{course.coverObjectKey?<Image src={`/api/catalog/products/${course.id}/cover`} alt={`${course.name} cover`} fill sizes="(max-width: 700px) 100vw, 360px"/>:<><span>Prepstore</span><strong>{course.name.slice(0,2).toUpperCase()}</strong></>}<b className={course.accessStatus==="EXPIRED"?"expired":""}>{course.accessStatus==="EXPIRED"?"Expired":"Active"}</b></div><div className="student-package-copy"><h2>{course.name}</h2><p>{course.description||"Structured study materials, tests and detailed results in one package."}</p><div className="package-inline-stats"><span>{course.materialCount} resources</span><span>{course.testCount} tests</span></div><div className="package-progress"><div><span>Progress</span><b>{completion}%</b></div><progress max="100" value={completion}/></div>{course.accessStatus==="ACTIVE"?<Link href={`/dashboard/courses/${course.slug}`}>{course.activeAttemptId?"Continue learning":"Open package"} <span>→</span></Link>:<span className="expired-package-action">Access expired {course.expiresAt?`on ${new Date(course.expiresAt).toLocaleDateString("en-IN")}`:""}</span>}</div></article>})}</div>:<section className="student-empty-package"><h2>No {status} packages found</h2><p>{search?"Try a different search term.":status==="active"?"Your active purchased packages will appear here.":"Expired packages will appear here."}</p>{status==="active"?<Link href="/packages">Explore packages</Link>:null}</section>}
  </WorkspaceShell>;
}
