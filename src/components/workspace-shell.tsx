import Link from "next/link";
import { Brand } from "./brand";
import { LogoutButton } from "@/features/account/account-actions";
import { CONTENT_PERMISSIONS, hasAnyContentPermission } from "@/features/admin-content/permissions";

export function WorkspaceShell({ admin, name, permissions = [], section, children }: { admin: boolean; name: string; permissions?: readonly string[]; section: string; children: React.ReactNode }) {
  const base = admin ? "/admin" : "/dashboard";
  const nav = [
    { key: "overview", href: base, label: "Overview", icon: "◈" },
    ...(admin && hasAnyContentPermission(permissions) ? [{ key: "content", href: "/admin/content", label: "Content", icon: "▤" }] : []),
    ...(admin && permissions.includes(CONTENT_PERMISSIONS.manageExams) ? [{ key: "exams", href: "/admin/exams", label: "Exams", icon: "◎" }] : []),
    ...(admin && [CONTENT_PERMISSIONS.createQuestions, CONTENT_PERMISSIONS.reviewQuestions, CONTENT_PERMISSIONS.publishQuestions].some((permission) => permissions.includes(permission)) ? [{ key: "questions", href: "/admin/questions", label: "Questions", icon: "?" }] : []),
    ...(admin && [CONTENT_PERMISSIONS.manageTests, CONTENT_PERMISSIONS.manageSchedules].some((permission) => permissions.includes(permission)) ? [{ key: "tests", href: "/admin/tests", label: "Tests", icon: "▣" }] : []),
    { key: "profile", href: "/account/profile", label: "My profile", icon: "○" },
    { key: "security", href: "/account/security", label: "Account security", icon: "◇" },
  ];
  const upcoming = admin ? ["Packages", "Bulk imports"] : ["Mock tests", "Results"];
  return <div className="workspace">
    <aside className="sidebar"><Brand /><div className="sidebar-label">{admin ? "ADMIN WORKSPACE" : "MY WORKSPACE"}</div><nav aria-label="Workspace">{nav.map((item) => <Link key={item.key} href={item.href} className={section === item.key ? "nav-item active" : "nav-item"} aria-current={section === item.key ? "page" : undefined}><span aria-hidden="true">{item.icon}</span>{item.label}</Link>)}</nav><div className="sidebar-next"><span className="sidebar-label">UP NEXT</span>{upcoming.map((label) => <div className="upcoming" key={label}>{label}<span>Coming soon</span></div>)}</div><div className="sidebar-bottom"><span className="avatar">{name.slice(0, 1).toUpperCase()}</span><div><strong>{name}</strong><small>{admin ? "Administrator" : "Student"}</small></div></div></aside>
    <div className="workspace-body"><header className="workspace-header"><div className="mobile-brand"><Brand /></div><span>{admin ? "Admin workspace" : "Student workspace"}</span><LogoutButton /></header><main id="main-content" className="workspace-main">{children}</main><nav className="mobile-nav" aria-label="Mobile workspace">{nav.map((item) => <Link key={item.key} href={item.href} aria-current={section === item.key ? "page" : undefined}>{item.label}</Link>)}</nav></div>
  </div>;
}
