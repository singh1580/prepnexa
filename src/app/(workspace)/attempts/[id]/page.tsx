import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { findAttempt } from "@/features/student-tests/service";
import { TestRunner } from "@/features/student-tests/ui/test-runner";

export const metadata = { title: "Test attempt" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const attempt = await findAttempt((await params).id, auth.user.id);
  if (!attempt) notFound();
  return <WorkspaceShell admin={false} name={auth.user.name} section="tests"><TestRunner attempt={attempt} /></WorkspaceShell>;
}
