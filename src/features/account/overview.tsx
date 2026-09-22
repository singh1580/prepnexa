import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { requireWorkspace } from "@/features/auth/page-access";

export async function Overview({ adminOnly = false }: { adminOnly?: boolean }) {
  const auth = await requireWorkspace(adminOnly);
  const canManageExams = auth.permissions.includes(CONTENT_PERMISSIONS.manageExams);
  return <WorkspaceShell admin={auth.admin} name={auth.user.name} permissions={auth.permissions} section="overview">
    <div className="page-heading"><span className="eyebrow">{auth.admin ? "YOUR CONTROL CENTRE" : "MAKE ROOM FOR PROGRESS"}</span><h1>{auth.admin ? "Your admin workspace" : "Your preparation starts here"}</h1><p>Welcome, {auth.user.name}. {auth.admin ? "Manage your exams, tests and learning materials." : "Your account is ready. Take a moment to make it yours."}</p></div>
    <div className="overview-grid">
      <section className="panel welcome-panel"><div className="large-icon" aria-hidden="true">{auth.admin ? "◇" : "○"}</div><h2>{auth.admin ? "Secure by design" : "A space that's yours"}</h2><p>{auth.admin ? "Two-factor authentication is enabled for your administrator account." : "Review your profile and keep your account details up to date."}</p><Link className="button" href={canManageExams ? "/admin/content" : auth.admin ? "/account/security" : "/account/profile"}>{canManageExams ? "Open content workspace" : auth.admin ? "View account security" : "View my profile"}</Link></section>
      <section className="panel"><span className="eyebrow">ACCOUNT AT A GLANCE</span><dl className="account-facts"><div><dt>Email address</dt><dd>{auth.user.email}</dd></div><div><dt>Verification</dt><dd><span className={auth.user.emailVerified ? "status-pill" : "status-pill pending"}>{auth.user.emailVerified ? "Email verified" : "Verification pending"}</span></dd></div><div><dt>Workspace</dt><dd>{auth.admin ? "Administrator" : "Student"}</dd></div></dl></section>
    </div>
    <section className="panel empty-state"><div className="empty-symbol" aria-hidden="true">▤</div><span className="eyebrow">{canManageExams ? "CONTENT" : auth.admin ? "COMING NEXT" : "PRACTICE"}</span><h2>{canManageExams ? "Content management is ready" : auth.admin ? "Your assigned tools will appear here" : "Your mock tests are ready"}</h2><p>{canManageExams ? "Manage exams, questions, tests, packages and imports from this workspace." : auth.admin ? "Navigation is generated from your server-side permissions." : "Open an available test, read its instructions and start or resume your attempt."}</p>{canManageExams ? <Link className="button secondary" href="/admin/exams">Manage exams</Link> : auth.admin ? <span className="quiet-tag">No action needed right now</span> : <Link className="button secondary" href="/dashboard/tests">Open my tests</Link>}</section>
  </WorkspaceShell>;
}
