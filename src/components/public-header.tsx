import Link from "next/link";
import { Brand } from "./brand";
import { getCurrentAuth } from "@/features/auth/authorization";
import { ADMIN_ROLE_KEYS } from "@/features/auth/constants";

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>;
}

export async function PublicHeader() {
  const auth = await getCurrentAuth();
  const dashboard = auth?.roles.some((role) => ADMIN_ROLE_KEYS.has(role)) ? "/admin" : "/dashboard";
  const links = [{ href: "/packages", label: "All packages" }];
  const navigation = <>{links.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}{auth ? <><Link href={dashboard}>Dashboard</Link><Link className="header-avatar" href={dashboard} aria-label={`${auth.user.name} dashboard`}>{auth.user.name.slice(0, 1).toUpperCase()}</Link></> : <><Link href="/login">Sign in</Link><Link className="button small" href="/signup">Create account</Link></>}</>;
  return <header className="public-header">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <Brand />
    <form className="header-search" action="/packages"><SearchIcon/><input name="q" aria-label="Search packages" placeholder="Search exams or packages" /></form>
    <nav className="desktop-public-nav" aria-label="Primary navigation">{navigation}</nav>
    <details className="mobile-public-menu">
      <summary>Menu</summary>
      <nav aria-label="Mobile primary navigation">{navigation}</nav>
    </details>
  </header>;
}
