import { WorkspaceShell } from "@/components/workspace-shell";
import { ProfileForm } from "@/features/account/account-actions";
import { requireWorkspace } from "@/features/auth/page-access";

export const metadata = { title: "My profile" };
export default async function Page() {
  const auth = await requireWorkspace();
  return <WorkspaceShell admin={auth.admin} name={auth.user.name} permissions={auth.permissions} section="profile"><div className="page-heading"><span className="eyebrow">YOUR DETAILS</span><h1>My profile</h1><p>Keep your account information accurate and up to date.</p></div><section className="panel narrow-panel"><ProfileForm name={auth.user.name} email={auth.user.email} verified={auth.user.emailVerified} /></section></WorkspaceShell>;
}
