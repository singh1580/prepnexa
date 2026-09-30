import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentCourseDashboard } from "@/features/student-courses/service";

export const metadata = { title: "Student dashboard" };

export default async function Page() {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const { courses, summary } = await getStudentCourseDashboard(auth.user.id);
  const availableTests = courses.reduce((total, course) => total + course.testCount, 0);
  const completedAttempts = courses.reduce((total, course) => total + course.completedAttempts, 0);
  const continueCourse = courses.find((course) => course.activeAttemptId) ?? courses[0];
  return <WorkspaceShell admin={false} name={auth.user.name} section="overview">
    <section className="student-hero"><div><span className="eyebrow">WELCOME BACK</span><h1>Keep your preparation moving, {auth.user.name.split(" ")[0]}.</h1><p>Your courses, active test and recent performance are organised in one place.</p></div>{continueCourse ? <Link className="button" href={`/dashboard/courses/${continueCourse.slug}`}>{continueCourse.activeAttemptId ? "Continue learning" : "Open course"}</Link> : <Link className="button" href="/packages">Explore courses</Link>}</section>
    <section className="student-metrics" aria-label="Learning overview"><article><span>My courses</span><strong>{courses.length}</strong><small>Currently accessible</small></article><article><span>Available tests</span><strong>{availableTests}</strong><small>Across your courses</small></article><article><span>Completed attempts</span><strong>{completedAttempts}</strong><small>Evaluated submissions</small></article><article><span>Unread updates</span><strong>{summary.unreadNotifications}</strong><small>Notifications waiting</small></article></section>
    <div className="student-dashboard-grid"><section><div className="section-heading"><div><span className="eyebrow">MY LEARNING</span><h2>Your courses</h2></div><Link className="text-button" href="/dashboard/courses">View all</Link></div>{courses.length ? <div className="course-list-compact">{courses.slice(0, 3).map((course) => <Link className="course-row" href={`/dashboard/courses/${course.slug}`} key={course.id}><span className="course-symbol" aria-hidden="true">{course.name.slice(0, 1)}</span><div><strong>{course.name}</strong><small>{course.testCount} tests · {course.materialCount} materials</small></div><span>{course.activeAttemptId ? "Continue →" : "Open →"}</span></Link>)}</div> : <div className="panel compact-empty"><h2>No active courses</h2><p>Explore Prepstore courses to begin learning.</p></div>}</section>
      <aside className="panel dashboard-side-card"><span className="eyebrow">RECENT PERFORMANCE</span>{summary.latestResultId ? <><h2>{summary.latestResultTitle}</h2><strong className="dashboard-score">{summary.latestResultScore} <small>/ {summary.latestResultMaxScore}</small></strong><p>{summary.latestResultPublishedAt ? `Completed ${new Date(summary.latestResultPublishedAt).toLocaleDateString("en-IN")}` : "Latest evaluated attempt"}</p><Link className="button secondary" href={`/results/${summary.latestResultId}?course=${summary.latestResultCourseSlug}`}>View analysis</Link></> : <><h2>Your first result will appear here</h2><p>Complete a course test to unlock score and section analysis.</p></>}<div className="dashboard-quick-links"><Link href="/dashboard/orders"><span>Orders</span><b>{summary.orders}</b></Link><Link href="/dashboard/support"><span>Open support tickets</span><b>{summary.openTickets}</b></Link></div></aside>
    </div>
  </WorkspaceShell>;
}
