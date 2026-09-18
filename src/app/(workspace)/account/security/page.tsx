import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { LogoutButton } from "@/features/account/account-actions";
import { requireWorkspace } from "@/features/auth/page-access";
export const metadata = { title: "Account security" };
export default async function Page() {
  const auth = await requireWorkspace();
  return <WorkspaceShell admin={auth.admin} name={auth.user.name} section="security"><div className="page-heading"><span className="eyebrow">ACCOUNT PROTECTION</span><h1>Account security</h1><p>Review the sign-in methods protecting your account.</p></div><div className="security-list"><section className="panel security-row"><span className="security-icon" aria-hidden="true">✉</span><div><h2>Email address</h2><p>{auth.user.email}</p></div><span className={auth.user.emailVerified ? "status-pill" : "status-pill pending"}>{auth.user.emailVerified ? "Verified" : "Pending"}</span></section><section className="panel security-row"><span className="security-icon" aria-hidden="true">●</span><div><h2>Password</h2><p>Use a unique password and update it if you suspect any unusual activity.</p></div><Link className="button secondary" href="/forgot-password">Reset password</Link></section>{auth.admin && <section className="panel security-row"><span className="security-icon" aria-hidden="true">◇</span><div><h2>Two-factor authentication</h2><p>Your administrator sign-in requires an authenticator or unused recovery code.</p></div><span className="status-pill">Enabled</span></section>}<section className="panel security-row"><span className="security-icon" aria-hidden="true">□</span><div><h2>Current session</h2><p>This device is signed in until {auth.expiresAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}, unless you sign out earlier.</p></div><LogoutButton /></section></div></WorkspaceShell>;
}

