import Link from "next/link";
import { Brand } from "./brand";
import { getCurrentAuth } from "@/features/auth/authorization";
import { ADMIN_ROLE_KEYS } from "@/features/auth/constants";
import { CartCount } from "@/features/commerce/ui/cart-workflow";
import { PublicSearch } from "./public-search";

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 4h2l2 11h10l2-8H6" />
      <circle cx="9" cy="19" r="1.2" />
      <circle cx="17" cy="19" r="1.2" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
export async function PublicHeader({
  auth: suppliedAuth,
}: { auth?: Awaited<ReturnType<typeof getCurrentAuth>> } = {}) {
  const auth =
    suppliedAuth === undefined ? await getCurrentAuth() : suppliedAuth;
  const dashboard = auth?.roles.some((role) => ADMIN_ROLE_KEYS.has(role))
    ? "/admin"
    : "/dashboard";
  const navigation = (
    <>
      <Link href="/packages">Packages</Link>
      <Link className="header-cart" href="/cart" aria-label="Cart">
        <CartIcon />
        <CartCount />
      </Link>
      {auth ? (
        <>
          <Link href={dashboard}>Dashboard</Link>
          <Link
            className="header-avatar"
            href={dashboard}
            aria-label={`${auth.user.name} dashboard`}
          >
            {auth.user.name.slice(0, 1).toUpperCase()}
          </Link>
        </>
      ) : (
        <>
          <Link href="/login">Sign in</Link>
          <Link className="button header-create-account" href="/signup">
            Create account
          </Link>
        </>
      )}
    </>
  );
  return (
    <header className="public-header">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Brand />
      <PublicSearch />
      <nav className="desktop-public-nav" aria-label="Primary navigation">
        {navigation}
      </nav>
      <details className="mobile-public-menu">
        <summary aria-label="Open navigation">
          <MenuIcon />
          <span>Menu</span>
        </summary>
        <nav aria-label="Mobile primary navigation">{navigation}</nav>
      </details>
    </header>
  );
}
