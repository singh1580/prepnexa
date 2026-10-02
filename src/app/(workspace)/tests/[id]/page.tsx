import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentNotifications } from "@/features/operations/service";
import { getStudentTest } from "@/features/student-tests/service";
import { AppError } from "@/lib/errors/app-error";
import { TestInstructionsStart } from "@/features/student-tests/ui/test-instructions-start";

export const metadata = { title: "Test instructions" };
function TestIcon({name}:{name:"time"|"questions"|"marks"|"attempt"|"format"|"rules"}){const paths={time:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,questions:<><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h5M8 16h7"/></>,marks:<><path d="M5 4h14v16H5zM8 9l2 2 5-5"/></>,attempt:<><circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/></>,format:<><path d="M5 4h14v16H5zM8 8h8M8 12h5"/></>,rules:<><path d="M12 3 5 6v5c0 4.5 2.8 8.3 7 10 4.2-1.7 7-5.5 7-10V6z"/><path d="m9 12 2 2 4-5"/></>};return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>}

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ course?: string }> }) {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const notificationsPromise=getStudentNotifications(auth.user.id);
  let test;
  try { test = await getStudentTest((await params).id, auth.user.id); }
  catch (error) { if (error instanceof AppError && error.status === 404) notFound(); throw error; }
  const notifications=await notificationsPromise;
  const exhausted = test.attemptsUsed >= test.maxAttempts && !test.activeAttemptId;
  const courseSlug = (await searchParams).course;
  const courseHref = courseSlug ? `/dashboard/courses/${encodeURIComponent(courseSlug)}?view=tests` : "/dashboard/courses";
  const sectionCount=test.sectionCount;
  return <WorkspaceShell admin={false} name={auth.user.name} section="courses" unreadNotifications={notifications.unreadCount}>
    <nav className="student-breadcrumb" aria-label="Breadcrumb"><Link href="/dashboard/courses">My Packages</Link><span>›</span>{courseSlug?<Link href={courseHref}>{courseSlug.replaceAll("-"," ")}</Link>:null}<span>›</span><b>{test.title}</b></nav>
    <header className="reference-test-heading"><h1>{test.title}</h1><p>{test.instructions?.split("\n").find(Boolean)||"Full-length mock test designed to simulate the actual exam pattern and difficulty level."}</p></header>
    {!test.hasAccess?<section className="student-empty-package"><h2>Access required</h2><p>This test is not included in your active packages.</p><Link href="/packages">Explore packages</Link></section>:<>
      <section className="test-fact-row"><article><i><TestIcon name="time"/></i><div><strong>{test.durationMinutes} minutes</strong><span>Duration</span></div></article><article><i><TestIcon name="questions"/></i><div><strong>{test.questionCount} questions</strong><span>Total questions</span></div></article><article><i><TestIcon name="marks"/></i><div><strong>Per question</strong><span>Marks shown in test</span></div></article><article><i><TestIcon name="attempt"/></i><div><strong>{test.maxAttempts} attempt{test.maxAttempts===1?"":"s"}</strong><span>Allowed</span></div></article></section>
      <section className="reference-instructions"><h2>Important instructions</h2><div className="instruction-items"><article><i><TestIcon name="format"/></i><div><h3>Test format</h3><p>The test consists of {sectionCount||"multiple"} section{sectionCount===1?"":"s"}{sectionCount?` and ${test.questionCount} questions`:""}. Use the section tabs during the test to move between sections.</p></div></article><article><i><TestIcon name="marks"/></i><div><h3>Marking scheme</h3><p>Marks and negative marks are displayed with each question. Read them before selecting your answer.</p></div></article><article><i><TestIcon name="time"/></i><div><h3>Time management</h3><p>Total duration is {test.durationMinutes} minutes. You can switch between sections any time before submission.</p></div></article><article><i><TestIcon name="attempt"/></i><div><h3>Attempt policy</h3><p>You have {test.maxAttempts} attempt{test.maxAttempts===1?"":"s"} for this test. Submitted attempts cannot be reopened.</p></div></article><article><i><TestIcon name="rules"/></i><div><h3>General guidelines</h3><ul><li>Ensure a stable internet connection.</li><li>Do not refresh or close the browser during submission.</li><li>Your answers are auto-saved as you continue.</li><li>Follow all on-screen instructions carefully.</li></ul></div></article></div></section>
      <div className="instruction-page-actions"><TestInstructionsStart testId={test.id} activeAttemptId={test.activeAttemptId} courseSlug={courseSlug} exhausted={exhausted}/></div>
    </>}
  </WorkspaceShell>;
}
