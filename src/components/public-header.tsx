import Link from "next/link";
import { Brand } from "./brand";
import { getCurrentAuth } from "@/features/auth/authorization";
import { ADMIN_ROLE_KEYS } from "@/features/auth/constants";
import { CartCount } from "@/features/commerce/ui/cart-workflow";
import { PublicSearch } from "./public-search";

export async function PublicHeader() {
  const auth = await getCurrentAuth();
  const dashboard = auth?.roles.some((role) => ADMIN_ROLE_KEYS.has(role)) ? "/admin" : "/dashboard";
  const links = [{ href: "/packages", label: "All packages" }];
  const navigation = <>{links.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}<Link className="header-cart" href="/cart">Cart <CartCount /></Link>{auth ? <><Link href={dashboard}>Dashboard</Link><Link className="header-avatar" href={dashboard} aria-label={`${auth.user.name} dashboard`}>{auth.user.name.slice(0, 1).toUpperCase()}</Link></> : <><Link href="/login">Sign in</Link><Link className="button small" href="/signup">Create account</Link></>}</>;
  return <header className="public-header">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <Brand />
    <PublicSearch />
    <nav className="desktop-public-nav" aria-label="Primary navigation">{navigation}</nav>
    <details className="mobile-public-menu">
      <summary>Menu</summary>
      <nav aria-label="Mobile primary navigation">{navigation}</nav>
    </details>
  </header>;
}
