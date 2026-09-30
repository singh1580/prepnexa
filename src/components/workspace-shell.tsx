import Link from "next/link";
import { Brand } from "./brand";
import { LogoutButton } from "@/features/account/account-actions";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { OPERATIONS_PERMISSIONS } from "@/features/operations/permissions";

type NavItem = { key: string; href: string; label: string; icon: string };

function adminNavigation(permissions: readonly string[]): NavItem[] {
  return [
    { key: "overview", href: "/admin", label: "Dashboard", icon: "◈" },
    ...(permissions.includes(CONTENT_PERMISSIONS.manageMaterials) ? [{ key: "materials", href: "/admin/materials", label: "Store & materials", icon: "▤" }] : []),
    ...([CONTENT_PERMISSIONS.manageTests, CONTENT_PERMISSIONS.manageSchedules].some((permission) => permissions.includes(permission)) ? [{ key: "tests", href: "/admin/tests", label: "Tests & practice sets", icon: "▣" }] : []),
    ...(permissions.includes(CONTENT_PERMISSIONS.manageProducts) ? [{ key: "packages", href: "/admin/packages", label: "Product package builder", icon: "◇" }] : []),
    { key: "coupons", href: "/admin/coupons", label: "Coupons", icon: "%" },
    { key: "orders", href: "/admin/orders", label: "Orders & payments", icon: "₹" },
    ...(permissions.includes(OPERATIONS_PERMISSIONS.readStudents) ? [{ key: "students", href: "/admin/students", label: "Students", icon: "○" }] : []),
    ...(permissions.includes(OPERATIONS_PERMISSIONS.manageSupport) ? [{ key: "support", href: "/admin/support", label: "Support", icon: "?" }] : []),
    ...(permissions.includes(OPERATIONS_PERMISSIONS.manageNotifications) ? [{ key: "notifications", href: "/admin/notifications", label: "Notifications", icon: "!" }] : []),
    { key: "profile", href: "/account/profile", label: "Profile & security", icon: "○" },
  ];
}

const studentNavigation: NavItem[] = [
  { key: "overview", href: "/dashboard", label: "Dashboard", icon: "◈" },
  { key: "courses", href: "/dashboard/courses", label: "My courses", icon: "▣" },
  { key: "explore", href: "/packages", label: "Explore courses", icon: "⌕" },
  { key: "orders", href: "/dashboard/orders", label: "My orders", icon: "₹" },
  { key: "notifications", href: "/dashboard/notifications", label: "Notifications", icon: "!" },
  { key: "support", href: "/dashboard/support", label: "Support", icon: "?" },
  { key: "profile", href: "/account/profile", label: "My account", icon: "○" },
];

function Navigation({ items, section }: { items: NavItem[]; section: string }) {
  return <nav aria-label="Workspace">{items.map((item) => <Link key={item.key} href={item.href} className={section === item.key ? "nav-item active" : "nav-item"} aria-current={section === item.key ? "page" : undefined}><span aria-hidden="true">{item.icon}</span>{item.label}</Link>)}</nav>;
}

export function WorkspaceShell({ admin, name, permissions = [], section, children }: { admin: boolean; name: string; permissions?: readonly string[]; section: string; children: React.ReactNode }) {
  const nav = admin ? adminNavigation(permissions) : studentNavigation;
  return <div className={admin ? "workspace admin-workspace" : "workspace student-workspace"}>
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <aside className="sidebar"><Brand /><div className="sidebar-label">{admin ? "ADMIN WORKSPACE" : "LEARNING WORKSPACE"}</div><Navigation items={nav} section={section} /><div className="sidebar-bottom"><span className="avatar">{name.slice(0, 1).toUpperCase()}</span><div><strong>{name}</strong><small>{admin ? "Administrator" : "Student"}</small></div></div></aside>
    <div className="workspace-body"><header className="workspace-header"><div className="mobile-brand"><Brand /></div><span>{admin ? "Prepstore administration" : "Prepstore learning"}</span><LogoutButton /></header><details className={admin ? "admin-mobile-menu" : "student-mobile-menu"}><summary><span aria-hidden="true">☰</span> {admin ? "Admin menu" : "Student menu"}</summary><Navigation items={nav} section={section} /></details><main id="main-content" className="workspace-main">{children}</main></div>
  </div>;
}
