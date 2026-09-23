import Link from "next/link";
import { Brand } from "./brand";
import { LogoutButton } from "@/features/account/account-actions";
import { CONTENT_PERMISSIONS, hasAnyContentPermission } from "@/features/admin-content/permissions";
import { OPERATIONS_PERMISSIONS } from "@/features/operations/permissions";

export function WorkspaceShell({ admin, name, permissions = [], section, children }: { admin: boolean; name: string; permissions?: readonly string[]; section: string; children: React.ReactNode }) {
  const base = admin ? "/admin" : "/dashboard";
  const nav = [
    { key: "overview", href: base, label: "Overview", icon: "◈" },
    ...(admin && hasAnyContentPermission(permissions) ? [{ key: "content", href: "/admin/content", label: "Content", icon: "▤" }] : []),
    ...(admin && permissions.includes(CONTENT_PERMISSIONS.manageExams) ? [{ key: "exams", href: "/admin/exams", label: "Exams", icon: "◎" }] : []),
    ...(admin && [CONTENT_PERMISSIONS.createQuestions, CONTENT_PERMISSIONS.reviewQuestions, CONTENT_PERMISSIONS.publishQuestions].some((permission) => permissions.includes(permission)) ? [{ key: "questions", href: "/admin/questions", label: "Question bank", icon: "?" }] : []),
    ...(admin && [CONTENT_PERMISSIONS.manageTests, CONTENT_PERMISSIONS.manageSchedules].some((permission) => permissions.includes(permission)) ? [{ key: "tests", href: "/admin/tests", label: "Tests & practice sets", icon: "▣" }] : []),

    ...(admin && [CONTENT_PERMISSIONS.manageProducts, CONTENT_PERMISSIONS.manageMaterials].some((permission) => permissions.includes(permission)) ? [{ key: "packages", href: "/admin/packages", label: "Store & materials", icon: "◇" }] : []),
    ...(admin ? [{ key: "coupons", href: "/admin/coupons", label: "Coupons", icon: "%" }, { key: "orders", href: "/admin/orders", label: "Orders & payments", icon: "₹" }] : []),
    ...(admin && permissions.includes(OPERATIONS_PERMISSIONS.readStudents) ? [{ key: "students", href: "/admin/students", label: "Students", icon: "○" }] : []),
    ...(admin && permissions.includes(OPERATIONS_PERMISSIONS.manageSupport) ? [{ key: "support", href: "/admin/support", label: "Support", icon: "?" }] : []),
    ...(admin && permissions.includes(OPERATIONS_PERMISSIONS.manageNotifications) ? [{ key: "notifications", href: "/admin/notifications", label: "Notifications", icon: "!" }] : []),
    ...(admin && permissions.includes(OPERATIONS_PERMISSIONS.readAudit) ? [{ key: "activity", href: "/admin/activity", label: "Activity", icon: "≡" }] : []),
    ...(!admin ? [{ key: "tests", href: "/dashboard/tests", label: "My tests", icon: "▣" }] : []),
    ...(!admin ? [{ key: "library", href: "/dashboard/library", label: "My library", icon: "▤" }] : []),
    ...(!admin ? [{ key: "results", href: "/dashboard/results", label: "Results", icon: "✓" }] : []),
    ...(!admin ? [{ key: "orders", href: "/dashboard/orders", label: "My orders", icon: "₹" }] : []),
    ...(!admin ? [{ key: "notifications", href: "/dashboard/notifications", label: "Notifications", icon: "!" }] : []),
    ...(!admin ? [{ key: "support", href: "/dashboard/support", label: "Support", icon: "?" }] : []),
    { key: "profile", href: "/account/profile", label: "My profile", icon: "○" },
    { key: "security", href: "/account/security", label: "Account security", icon: "◇" },
  ];
  const upcoming: string[] = [];
  return <div className="workspace">
    <aside className="sidebar"><Brand /><div className="sidebar-label">{admin ? "ADMIN WORKSPACE" : "MY WORKSPACE"}</div><nav aria-label="Workspace">{nav.map((item) => <Link key={item.key} href={item.href} className={section === item.key ? "nav-item active" : "nav-item"} aria-current={section === item.key ? "page" : undefined}><span aria-hidden="true">{item.icon}</span>{item.label}</Link>)}</nav>{upcoming.length > 0 ? <div className="sidebar-next"><span className="sidebar-label">UP NEXT</span>{upcoming.map((label) => <div className="upcoming" key={label}>{label}<span>Coming soon</span></div>)}</div> : null}<div className="sidebar-bottom"><span className="avatar">{name.slice(0, 1).toUpperCase()}</span><div><strong>{name}</strong><small>{admin ? "Administrator" : "Student"}</small></div></div></aside>
    <div className="workspace-body"><header className="workspace-header"><div className="mobile-brand"><Brand /></div><span>{admin ? "Admin workspace" : "Student workspace"}</span><LogoutButton /></header><main id="main-content" className="workspace-main">{children}</main><nav className="mobile-nav" aria-label="Mobile workspace">{nav.map((item) => <Link key={item.key} href={item.href} aria-current={section === item.key ? "page" : undefined}>{item.label}</Link>)}</nav></div>
  </div>;
}
