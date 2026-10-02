import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentNotifications } from "@/features/operations/service";
import { getStudentCourseDashboard } from "@/features/student-courses/service";

export const metadata = { title: "Student dashboard" };

function DashboardIcon({ name }: { name: "package" | "progress" | "test" | "bell" | "explore" | "order" | "support" }) {
  const paths = {
    package: <><path d="m4 7 8-4 8 4-8 4z"/><path d="m4 7v10l8 4 8-4V7M12 11v10"/></>,
    progress: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    test: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    explore: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    order: <><path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6"/></>,
    support: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.6 2.6 0 1 1 4.2 2c-1 .7-1.7 1.2-1.7 2.5M12 17h.01"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default async function Page() {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const [{ courses, summary, recentResults }, notifications] = await Promise.all([
    getStudentCourseDashboard(auth.user.id),
    getStudentNotifications(auth.user.id),
  ]);
  const availableTests = courses.reduce((total, course) => total + course.testCount, 0);
  const completedAttempts = courses.reduce((total, course) => total + course.completedAttempts, 0);
  const progress = availableTests ? Math.min(100, Math.round((completedAttempts / availableTests) * 100)) : 0;
  const continueCourse = courses.find((course) => course.activeAttemptId) ?? courses[0];
  const chartResults = [...recentResults].reverse();
  const average = recentResults.length ? Math.round(recentResults.reduce((total, result) => total + (Number(result.maxScore) ? Number(result.score) / Number(result.maxScore) * 100 : 0), 0) / recentResults.length) : null;
  const firstName = auth.user.name.split(" ")[0];

  return <WorkspaceShell admin={false} name={auth.user.name} section="overview" unreadNotifications={notifications.unreadCount}>
    <section className="student-reference-banner">
      <div><span>WELCOME BACK</span><h1>Keep learning, {firstName}!</h1><p>Pick up where you left off and keep moving towards your goals.</p>{continueCourse ? <Link href={continueCourse.activeAttemptId ? `/attempts/${continueCourse.activeAttemptId}?course=${continueCourse.slug}` : `/dashboard/courses/${continueCourse.slug}`}>Continue learning <b>→</b></Link> : <Link href="/packages">Explore packages <b>→</b></Link>}</div>
      <Image src="/images/student-dashboard-banner.webp" alt="Student learning online" fill priority sizes="(max-width: 800px) 100vw, 70vw" />
    </section>

    {continueCourse ? <section className="student-section"><div className="student-section-heading"><h2>Continue learning</h2><Link href={`/dashboard/courses/${continueCourse.slug}`}>View package</Link></div><article className="continue-learning-card"><div className="course-tile">{continueCourse.coverObjectKey ? <Image src={`/api/catalog/products/${continueCourse.id}/cover`} alt="" fill sizes="88px" /> : <b>{continueCourse.name.slice(0, 2).toUpperCase()}</b>}</div><div><small>{continueCourse.activeAttemptId ? "TEST IN PROGRESS" : "YOUR PACKAGE"}</small><h3>{continueCourse.activeTestTitle ?? continueCourse.name}</h3><p>{continueCourse.name}</p></div><div className="continue-progress"><span>{Math.min(100, continueCourse.testCount ? Math.round(continueCourse.completedAttempts / continueCourse.testCount * 100) : 0)}% complete</span><progress max="100" value={continueCourse.testCount ? Math.min(100, Math.round(continueCourse.completedAttempts / continueCourse.testCount * 100)) : 0}/><Link href={continueCourse.activeAttemptId ? `/attempts/${continueCourse.activeAttemptId}?course=${continueCourse.slug}` : `/dashboard/courses/${continueCourse.slug}`}>Continue <b>→</b></Link></div></article></section> : null}

    <section className="student-reference-metrics" aria-label="Learning overview">
      <article><i><DashboardIcon name="package"/></i><div><strong>{courses.length}</strong><span>Active packages</span></div></article>
      <article><i><DashboardIcon name="progress"/></i><div><strong>{progress}%</strong><span>Overall progress</span></div></article>
      <article><i><DashboardIcon name="test"/></i><div><strong>{completedAttempts}</strong><span>Tests attempted</span></div></article>
      <article><i><DashboardIcon name="bell"/></i><div><strong>{summary.unreadNotifications}</strong><span>Unread updates</span></div></article>
    </section>

    <section className="student-section"><div className="student-section-heading"><h2>My packages</h2><Link href="/dashboard/courses">View all <span>→</span></Link></div>{courses.length ? <div className="dashboard-package-list">{courses.slice(0, 3).map((course) => <Link href={`/dashboard/courses/${course.slug}`} key={course.id}><span className="dashboard-package-cover">{course.coverObjectKey ? <Image src={`/api/catalog/products/${course.id}/cover`} alt="" fill sizes="64px"/> : course.name.slice(0, 2).toUpperCase()}</span><div><strong>{course.name}</strong><small>{course.materialCount} materials · {course.testCount} tests</small></div><b>{course.activeAttemptId ? "Continue" : "Open"} →</b></Link>)}</div> : <div className="student-empty-row"><p>No active packages yet.</p><Link href="/packages">Explore packages</Link></div>}</section>

    <div className="student-dashboard-bottom">
      <section className="student-data-card"><div className="student-section-heading"><div><h2>Recent performance</h2><p>{average === null ? "Complete a test to see your progress" : `Average score ${average}%`}</p></div>{summary.latestResultId ? <Link href={`/results/${summary.latestResultId}?course=${summary.latestResultCourseSlug}`}>View analysis</Link> : null}</div>{chartResults.length ? <div className="performance-chart" aria-label="Recent test scores">{chartResults.map((result) => { const value = Number(result.maxScore) ? Math.round(Number(result.score) / Number(result.maxScore) * 100) : 0; return <div key={result.id}><span title={`${result.title}: ${value}%`} style={{height:`${Math.max(8,value)}%`}}/><small>{value}%</small></div>; })}</div> : <div className="empty-chart"><span/><span/><span/><span/><span/></div>}</section>
      <section className="student-data-card"><div className="student-section-heading"><h2>Notifications</h2><Link href="/dashboard/notifications">View all</Link></div><div className="dashboard-notification-list">{notifications.items.slice(0, 3).map((item, index) => <Link href="/dashboard/notifications" key={item.id}><i className={`notice-tone-${index % 3}`}><DashboardIcon name={index % 3 === 0 ? "bell" : index % 3 === 1 ? "test" : "package"}/></i><div><strong>{item.title}</strong><small>{item.body}</small></div>{!item.readAt ? <b aria-label="Unread"/> : null}</Link>)}{!notifications.items.length ? <p>No new notifications.</p> : null}</div></section>
    </div>

    <section className="student-section"><div className="student-section-heading"><h2>Quick links</h2></div><div className="student-quick-links"><Link href="/packages"><i><DashboardIcon name="explore"/></i><span><b>Explore packages</b><small>Find your next learning package</small></span><strong>→</strong></Link><Link href="/dashboard/orders"><i><DashboardIcon name="order"/></i><span><b>My orders</b><small>View payments and invoices</small></span><strong>→</strong></Link><Link href="/dashboard/support"><i><DashboardIcon name="support"/></i><span><b>Support</b><small>Get help from our team</small></span><strong>→</strong></Link></div></section>
  </WorkspaceShell>;
}
