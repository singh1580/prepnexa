import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { findAttempt } from "@/features/student-tests/service";
import { TestRunner } from "@/features/student-tests/ui/test-runner";
import { getStudentNotifications } from "@/features/operations/service";
import { getStudentResultForAttempt } from "@/features/student-results/service";

export const metadata = { title: "Test attempt" };
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ course?: string }> }) {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const [attempt,notifications] = await Promise.all([findAttempt((await params).id, auth.user.id),getStudentNotifications(auth.user.id)]);
  if (!attempt) notFound();
  const courseSlug = attempt.productSlug ?? (await searchParams).course;
  if (!["CREATED", "IN_PROGRESS"].includes(attempt.status)) {
    const resultId = await getStudentResultForAttempt(attempt.id, auth.user.id);
    const courseQuery = courseSlug
      ? `?course=${encodeURIComponent(courseSlug)}`
      : "";
    redirect(`/results/${resultId}${courseQuery}`);
  }
  return <WorkspaceShell admin={false} name={auth.user.name} email={auth.user.email} section="courses" unreadNotifications={notifications.unreadCount} activePackageSlug={courseSlug} activePackageView="tests"><TestRunner attempt={attempt} courseSlug={courseSlug} /></WorkspaceShell>;
}
