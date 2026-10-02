import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { LogoutButton, ProfileForm } from "@/features/account/account-actions";
import { requireWorkspace } from "@/features/auth/page-access";
import { getActiveSessions, getStudentNotifications } from "@/features/operations/service";
import { SessionList } from "@/features/operations/ui/student-actions";

export const metadata={title:"My account"};
export default async function Page(){
  const auth=await requireWorkspace();const[sessions,notifications]=await Promise.all([getActiveSessions(auth.user.id,auth.sessionId),getStudentNotifications(auth.user.id)]);
  return <WorkspaceShell admin={auth.admin} name={auth.user.name} permissions={auth.permissions} section="profile" unreadNotifications={notifications.unreadCount}>
    <header className="student-page-heading account-page-heading"><div><h1>My Account</h1><p>Manage your profile, security and preferences.</p></div></header>
    <div className="account-reference-content">
      <section id="profile"><div className="account-section-heading"><div><h2>Profile Details</h2><p>Update your personal information.</p></div><span className="account-avatar-large">{auth.user.name.slice(0,1).toUpperCase()}</span></div><ProfileForm name={auth.user.name} email={auth.user.email} phone={auth.user.phone} verified={auth.user.emailVerified}/></section>
      <section id="contact"><div className="account-section-heading"><div><h2>Contact Information</h2><p>Your contact details are used for important updates.</p></div></div><div className="account-detail-row"><div><span>Email Address</span><strong>{auth.user.email}</strong></div><b className={auth.user.emailVerified?"verified":"pending"}>{auth.user.emailVerified?"Verified":"Verification pending"}</b></div><div className="account-detail-row"><div><span>Phone Number</span><strong>{auth.user.phone||"Not added"}</strong></div><a href="#profile">Change</a></div></section>
      <section id="security"><div className="account-section-heading"><div><h2>Password &amp; Security</h2><p>Keep your account secure.</p></div></div><div className="account-detail-row"><div><span>Password</span><strong>••••••••••••</strong></div><Link href="/forgot-password">Change password</Link></div><div className="account-detail-row"><div><span>Two-factor authentication</span><strong>{auth.admin?"Enabled for administrator access":"Available when additional verification is required"}</strong></div></div></section>
      <section id="sessions"><div className="account-section-heading"><div><h2>Active Sessions</h2><p>Manage where your account is currently signed in.</p></div><LogoutButton/></div><SessionList sessions={sessions}/></section>
      <section id="preferences"><div className="account-section-heading"><div><h2>Notification Preferences</h2><p>Review order updates, important announcements and support replies.</p></div></div><div className="account-detail-row"><div><span>In-app notifications</span><strong>{notifications.unreadCount} unread update{notifications.unreadCount===1?"":"s"}</strong></div>{!auth.admin?<Link href="/dashboard/notifications">Manage notifications</Link>:null}</div></section>
    </div>
  </WorkspaceShell>;
}
