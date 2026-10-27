import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import {
  ChangePasswordForm,
  LogoutButton,
  NotificationPreferencesForm,
  ProfileForm,
  StudentProfileForm,
} from "@/features/account/account-actions";
import { findActiveTotpFactor } from "@/features/auth/repository";
import { requireWorkspace } from "@/features/auth/page-access";
import {
  getActiveSessions,
  getStudentNotifications,
} from "@/features/operations/service";
import { SessionList } from "@/features/operations/ui/student-actions";

export const metadata = { title: "My account" };
const accountSection =
  "scroll-mt-24 border-b border-[#e4e2df] px-5 py-6 last:border-b-0 max-[700px]:px-0";
const sectionHeading =
  "mb-4 flex items-start justify-between gap-4 [&_h2]:m-0 [&_h2]:text-[1.05rem] [&_p]:mt-[.3rem] [&_p]:mb-0 [&_p]:text-[.75rem] [&_p]:text-prep-muted";
const adminCard =
  "min-w-0 rounded-[.65rem] border border-[#e4e7ec] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,.04)]";
export default async function Page() {
  const auth = await requireWorkspace();
  const [sessions, notifications, mfa] = await Promise.all([
    getActiveSessions(auth.user.id, auth.sessionId),
    getStudentNotifications(auth.user.id),
    auth.admin
      ? findActiveTotpFactor(auth.user.id)
      : Promise.resolve(undefined),
  ]);
  return (
    <WorkspaceShell
      admin={auth.admin}
      name={auth.user.name}
      email={auth.user.email}
      permissions={auth.permissions}
      section="profile"
      unreadNotifications={notifications.unreadCount}
    >
      <header className="mb-[1.1rem]">
        <div>
          <h1 className="mt-0 mb-[.3rem] text-[clamp(1.65rem,2.4vw,2.25rem)] leading-[1.08] tracking-[-.04em]">
            {auth.admin ? "Profile & Security" : "My Account"}
          </h1>
          <p className="m-0 max-w-3xl text-[.88rem] text-[#687077]">
            {auth.admin
              ? "Manage your administrator profile, security and active sessions."
              : "Manage your personal details, learning profile and account preferences."}
          </p>
        </div>
      </header>
      {auth.admin ? (
        <div className="grid grid-cols-2 gap-4 max-[980px]:grid-cols-1">
          <section className={adminCard}>
            <div className="mb-5">
              <h2 className="m-0 text-[1rem]">Profile Details</h2>
            </div>
            <ProfileForm
              name={auth.user.name}
              email={auth.user.email}
              phone={auth.user.phone}
              verified={auth.user.emailVerified}
            />
          </section>
          <section className={adminCard}>
            <div className="mb-5">
              <h2 className="m-0 text-[1rem]">Change Password</h2>
            </div>
            <ChangePasswordForm />
          </section>
          <section className={adminCard}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="m-0 text-[1rem]">
                  Two-Factor Authentication (MFA)
                </h2>
                <p className="mt-1 mb-0 text-[.75rem] text-prep-muted">
                  Add an extra layer of security to your account.
                </p>
              </div>
              <span
                className={`inline-flex shrink-0 rounded-full border px-2 py-1 text-[.65rem] font-bold ${mfa ? "border-[#bfe2cc] bg-[#e7f4ec] text-[#276448]" : "border-[#f1d79b] bg-[#fff4d9] text-[#8a5b13]"}`}
              >
                {mfa ? "● Enabled" : "Required"}
              </span>
            </div>
            <dl className="m-0 [&>div]:flex [&>div]:justify-between [&>div]:gap-4 [&>div]:border-t [&>div]:border-[#eceae7] [&>div]:py-3 [&_dt]:text-[.75rem] [&_dt]:text-[#687077] [&_dd]:m-0 [&_dd]:text-right [&_dd]:text-[.75rem]">
              <div>
                <dt>Authentication method</dt>
                <dd>Authenticator app</dd>
              </div>
              <div>
                <dt>Enabled on</dt>
                <dd>
                  {mfa?.verifiedAt
                    ? new Date(mfa.verifiedAt).toLocaleString("en-IN")
                    : `Setup required at sign in`}
                </dd>
              </div>
            </dl>
            <p className="mb-0 text-[.75rem] leading-relaxed text-[#687077]">
              MFA is mandatory for administrator accounts and cannot be
              disabled.
            </p>
          </section>
          <section className={`${adminCard} col-span-full`}>
            <div className="mb-5 flex items-start justify-between gap-4 max-[520px]:flex-col">
              <div>
                <h2 className="m-0 text-[1rem]">Active Sessions</h2>
                <p className="mt-1 mb-0 text-[.75rem] text-prep-muted">
                  Devices currently signed into your account.
                </p>
              </div>
              <LogoutButton />
            </div>
            <SessionList sessions={sessions} />
          </section>
        </div>
      ) : null}
      {!auth.admin ? (
        <div className="border-l border-[#e4e2df] max-[700px]:border-l-0">
          <section className={accountSection} id="profile">
            <div className={sectionHeading}>
              <div>
                <h2>Profile Details</h2>
                <p>Update your personal and learning information.</p>
              </div>
              <span className="grid size-[3.2rem] shrink-0 place-items-center rounded-full bg-[#e7e9ed] font-extrabold text-[#43494e]">
                {auth.user.name.slice(0, 1).toUpperCase()}
              </span>
            </div>
            <StudentProfileForm
              profile={auth.user}
              verified={auth.user.emailVerified}
            />
          </section>
          <section className={accountSection} id="contact">
            <div className={sectionHeading}>
              <div>
                <h2>Contact Information</h2>
                <p>Your contact details are used for important updates.</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-[#eceae7] py-3">
              <div className="grid min-w-0 gap-1">
                <span className="text-[.68rem] text-prep-muted">
                  Email Address
                </span>
                <strong className="text-[.78rem] break-all">
                  {auth.user.email}
                </strong>
              </div>
              <b
                className={`shrink-0 rounded-full px-2 py-1 text-[.62rem] ${auth.user.emailVerified ? "bg-[#e2f5e9] text-[#177541]" : "bg-[#fff1d9] text-[#a9680d]"}`}
              >
                {auth.user.emailVerified ? "Verified" : "Verification pending"}
              </b>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-[#eceae7] py-3">
              <div className="grid min-w-0 gap-1">
                <span className="text-[.68rem] text-prep-muted">
                  Phone Number
                </span>
                <strong className="text-[.78rem]">
                  {auth.user.phone || "Not added"}
                </strong>
              </div>
              <a
                className="rounded-[.35rem] border border-[#d5d7d9] px-3 py-2 text-[.68rem] font-bold text-[#4d5459] hover:bg-[#f5f5f4]"
                href="#profile"
              >
                Change
              </a>
            </div>
          </section>
          <section className={accountSection} id="security">
            <div className={sectionHeading}>
              <div>
                <h2>Password &amp; Security</h2>
                <p>
                  Change your password here without leaving your signed-in
                  account.
                </p>
              </div>
            </div>
            <ChangePasswordForm />
            <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#eceae7] py-3">
              <div className="grid gap-1">
                <span className="text-[.68rem] text-prep-muted">
                  Two-factor authentication
                </span>
                <strong className="text-[.78rem]">
                  Available when additional verification is required
                </strong>
              </div>
            </div>
          </section>
          <section className={accountSection} id="sessions">
            <div className={`${sectionHeading} max-[520px]:flex-col`}>
              <div>
                <h2>Active Sessions</h2>
                <p>Manage where your account is currently signed in.</p>
              </div>
              <LogoutButton />
            </div>
            <SessionList sessions={sessions} />
          </section>
          <section className={accountSection} id="preferences">
            <div className={sectionHeading}>
              <div>
                <h2>Notification Preferences</h2>
                <p>
                  Choose how Prepstore sends order, support and learning
                  updates.
                </p>
              </div>
              <Link
                className="shrink-0 text-[.72rem] font-bold text-prep-orange"
                href="/dashboard/notifications"
              >
                {notifications.unreadCount} unread
              </Link>
            </div>
            <NotificationPreferencesForm profile={auth.user} />
          </section>
        </div>
      ) : null}
    </WorkspaceShell>
  );
}
