import Link from "next/link";
import { Brand } from "./brand";
import { LogoutButton } from "@/features/account/account-actions";

export function WorkspaceShell({ admin, name, section, children }: { admin: boolean; name: string; section: "overview" | "profile" | "security"; children: React.ReactNode }) {
  const base = admin ? "/admin" : "/dashboard";
  const nav = [{ key: "overview", href: base, label: "Overview", icon: "◈" }, { key: "profile", href: "/account/profile", label: "My profile", icon: "○" }, { key: "security", href: "/account/security", label: "Account security", icon: "◇" }];
  return <div className="workspace"><aside className="sidebar"><Brand /><div className="sidebar-label">{admin ? "ADMIN WORKSPACE" : "MY WORKSPACE"}</div><nav aria-label="Workspace">{nav.map(item => <Link key={item.key} href={item.href} className={section === item.key ? "nav-item active" : "nav-item"} aria-current={section === item.key ? "page" : undefined}><span aria-hidden="true">{item.icon}</span>{item.label}</Link>)}</nav><div className="sidebar-next"><span className="sidebar-label">UP NEXT</span>{(admin ? ["Exams & categories", "Question bank", "User management"] : ["Mock tests", "Results"]).map(label => <div className="upcoming" key={label}>{label}<span>Coming soon</span></div>)}</div><div className="sidebar-bottom"><span className="avatar">{name.slice(0,1).toUpperCase()}</span><div><strong>{name}</strong><small>{admin ? "Administrator" : "Student"}</small></div></div></aside><div className="workspace-body"><header className="workspace-header"><div className="mobile-brand"><Brand /></div><span>{admin ? "Admin workspace" : "Student workspace"}</span><LogoutButton /></header><main id="main-content" className="workspace-main">{children}</main><nav className="mobile-nav" aria-label="Mobile workspace">{nav.map(item => <Link key={item.key} href={item.href} aria-current={section === item.key ? "page" : undefined}>{item.label}</Link>)}</nav></div></div>;
}

