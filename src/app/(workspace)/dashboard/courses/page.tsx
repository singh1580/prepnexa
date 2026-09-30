import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentCourses } from "@/features/student-courses/service";

export const metadata = { title: "My courses" };
export default async function Page() {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const courses = await getStudentCourses(auth.user.id);
  return <WorkspaceShell admin={false} name={auth.user.name} section="courses"><header className="page-heading split-heading"><div><span className="eyebrow">LEARNING LIBRARY</span><h1>My courses</h1><p>Every purchased or free course, with its materials, tests and results together.</p></div><Link className="button secondary" href="/packages">Explore courses</Link></header>{courses.length ? <div className="course-card-grid">{courses.map((course) => { const completion = course.testCount ? Math.min(100, Math.round((course.completedAttempts / course.testCount) * 100)) : 0; return <article className="course-card" key={course.id}><div className="course-card-cover"><span>{course.accessSource === "FREE" ? "FREE COURSE" : "ENROLLED"}</span><b>{course.name.slice(0, 2).toUpperCase()}</b></div><div className="course-card-body"><h2>{course.name}</h2><p>{course.description || "Structured preparation resources and tests."}</p><div className="course-facts"><span>{course.materialCount} materials</span><span>{course.testCount} tests</span><span>{course.testCount + course.materialCount} items</span></div><div className="course-progress"><div><span>Test progress</span><b>{completion}%</b></div><progress value={completion} max="100">{completion}%</progress></div><Link className="button" href={`/dashboard/courses/${course.slug}`}>{course.activeAttemptId ? "Continue course" : "Open course"}</Link></div></article>; })}</div> : <section className="panel empty-state"><h2>No courses yet</h2><p>Your purchased and free courses will appear here.</p><Link className="button" href="/packages">Explore courses</Link></section>}</WorkspaceShell>;
}
