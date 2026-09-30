import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { hasAnyOperationsPermission } from "@/features/operations/permissions";
import {
  getAdminOperationsSummary,
  getStudentDashboardSummary,
} from "@/features/operations/service";

export async function Overview({ adminOnly = false }: { adminOnly?: boolean }) {
  const auth = await requireWorkspace(adminOnly);
  const operations =
    auth.admin && hasAnyOperationsPermission(auth.permissions)
      ? await getAdminOperationsSummary()
      : null;
  const studentSummary = !auth.admin
    ? await getStudentDashboardSummary(auth.user.id)
    : null;
  return (
    <WorkspaceShell
      admin={auth.admin}
      name={auth.user.name}
      permissions={auth.permissions}
      section="overview"
    >
      <div className="page-heading">
        <span className="eyebrow">
          {auth.admin ? "YOUR CONTROL CENTRE" : "MAKE ROOM FOR PROGRESS"}
        </span>
        <h1>
          {auth.admin ? "Your admin workspace" : "Your preparation starts here"}
        </h1>
        <p>
          Welcome, {auth.user.name}.{" "}
          {auth.admin
            ? "Manage your tests, learning materials and product packages."
            : "Your account is ready. Take a moment to make it yours."}
        </p>
      </div>
      {operations && (
        <div className="metric-grid">
          <article className="metric-card">
            <span>Students</span>
            <strong>{operations.students}</strong>
            <small>registered learners</small>
          </article>
          <article className="metric-card">
            <span>Open support</span>
            <strong>{operations.openTickets}</strong>
            <small>tickets needing attention</small>
          </article>
          <article className="metric-card">
            <span>Email queue</span>
            <strong>{operations.pendingDeliveries}</strong>
            <small>pending or failed</small>
          </article>
          <article className="metric-card">
            <span>Paid orders</span>
            <strong>{operations.paidOrders}</strong>
            <small>completed purchases</small>
          </article>
        </div>
      )}
      {studentSummary && (
        <div className="metric-grid student-summary">
          <Link className="metric-card" href="/dashboard/tests">
            <span>My tests</span>
            <strong>{studentSummary.tests}</strong>
            <small>available papers</small>
          </Link>
          <Link className="metric-card" href="/dashboard/library">
            <span>My library</span>
            <strong>{studentSummary.materials}</strong>
            <small>available resources</small>
          </Link>
          <Link className="metric-card" href="/dashboard/results">
            <span>Results</span>
            <strong>{studentSummary.results}</strong>
            <small>published reviews</small>
          </Link>
          <Link className="metric-card" href="/dashboard/orders">
            <span>Orders</span>
            <strong>{studentSummary.orders}</strong>
            <small>purchase records</small>
          </Link>
          <Link className="metric-card" href="/dashboard/notifications">
            <span>Notifications</span>
            <strong>{studentSummary.unreadNotifications}</strong>
            <small>unread updates</small>
          </Link>
          <Link className="metric-card" href="/dashboard/support">
            <span>Support</span>
            <strong>{studentSummary.openTickets}</strong>
            <small>open tickets</small>
          </Link>
        </div>
      )}
      <div className="overview-grid">
        <section className="panel welcome-panel">
          <div className="large-icon" aria-hidden="true">
            ○
          </div>
          <h2>
            {auth.admin ? "Administrator account" : "A space that's yours"}
          </h2>
          <p>
            Review your profile and keep your account details and security
            settings up to date.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/account/profile">
              View my profile
            </Link>
            <Link className="button secondary" href="/account/security">
              Security settings
            </Link>
          </div>
        </section>
        <section className="panel">
          <span className="eyebrow">ACCOUNT AT A GLANCE</span>
          <dl className="account-facts">
            <div>
              <dt>Email address</dt>
              <dd>{auth.user.email}</dd>
            </div>
            <div>
              <dt>Verification</dt>
              <dd>
                <span
                  className={
                    auth.user.emailVerified
                      ? "status-pill"
                      : "status-pill pending"
                  }
                >
                  {auth.user.emailVerified
                    ? "Email verified"
                    : "Verification pending"}
                </span>
              </dd>
            </div>
            <div>
              <dt>Workspace</dt>
              <dd>{auth.admin ? "Administrator" : "Student"}</dd>
            </div>
          </dl>
        </section>
      </div>
      {!auth.admin ? (
        <section className="panel empty-state">
          <div className="empty-symbol" aria-hidden="true">
            ▤
          </div>
          <span className="eyebrow">PRACTICE</span>
          <h2>Your mock tests are ready</h2>
          <p>
            Open an available test, read its instructions and start or resume
            your attempt.
          </p>
          <Link className="button secondary" href="/dashboard/tests">
            Open my tests
          </Link>
        </section>
      ) : null}
    </WorkspaceShell>
  );
}
