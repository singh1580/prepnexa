import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { LogoutButton } from "@/features/account/account-actions";
import { requireWorkspace } from "@/features/auth/page-access";
import { getActiveSessions } from "@/features/operations/service";
import { SessionList } from "@/features/operations/ui/student-actions";

export const metadata = { title: "Account security" };
export default async function Page() {
  const auth = await requireWorkspace();
  const sessions = await getActiveSessions(auth.user.id, auth.sessionId);
  return <WorkspaceShell admin={auth.admin} name={auth.user.name} permissions={auth.permissions} section="security"><div className="page-heading"><span className="eyebrow">ACCOUNT PROTECTION</span><h1>Account security</h1><p>Review the sign-in methods and active devices protecting your account.</p></div><div className="security-list"><section className="panel security-row"><span className="security-icon" aria-hidden="true">✉</span><div><h2>Email address</h2><p>{auth.user.email}</p></div><span className={auth.user.emailVerified ? "status-pill" : "status-pill pending"}>{auth.user.emailVerified ? "Verified" : "Pending"}</span></section><section className="panel security-row"><span className="security-icon" aria-hidden="true">●</span><div><h2>Password</h2><p>Use a unique password and update it if you suspect any unusual activity.</p></div><Link className="button secondary" href="/forgot-password">Reset password</Link></section>{auth.admin && <section className="panel security-row"><span className="security-icon" aria-hidden="true">◇</span><div><h2>Two-factor authentication</h2><p>Your administrator sign-in requires an authenticator or unused recovery code.</p></div><span className="status-pill">Enabled</span></section>}</div><div className="section-heading security-heading"><div><span className="eyebrow">ACTIVE DEVICES</span><h2>Signed-in sessions</h2></div><LogoutButton /></div><SessionList sessions={sessions} /></WorkspaceShell>;
}
