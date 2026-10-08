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
function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 21a7 7 0 0 1 14 0" />
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
  const desktopNavigation = (
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
  const mobileNavigation = (
    <>
      <Link href="/packages">All packages</Link>
      {auth ? (
        <Link href={dashboard}>Open dashboard</Link>
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
      <details className="mobile-public-menu">
        <summary aria-label="Open navigation">
          <MenuIcon />
          <span>Menu</span>
        </summary>
        <nav aria-label="Mobile primary navigation">{mobileNavigation}</nav>
      </details>
      <Brand />
      <PublicSearch />
      <nav className="desktop-public-nav" aria-label="Primary navigation">
        {desktopNavigation}
      </nav>
      <div className="mobile-public-actions">
        <Link className="header-cart" href="/cart" aria-label="Cart">
          <CartIcon />
          <CartCount />
        </Link>
        <Link
          className={auth ? "header-avatar" : "mobile-account-icon"}
          href={auth ? dashboard : "/login"}
          aria-label={auth ? `${auth.user.name} dashboard` : "Sign in"}
        >
          {auth ? auth.user.name.slice(0, 1).toUpperCase() : <AccountIcon />}
        </Link>
      </div>
    </header>
  );
}
