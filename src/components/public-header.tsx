import Link from "next/link";
import { Brand } from "./brand";
import { getCurrentAuth } from "@/features/auth/authorization";
import { ADMIN_ROLE_KEYS } from "@/features/auth/constants";
import { CartCount } from "@/features/commerce/ui/cart-workflow";
import { LogoutButton } from "@/features/account/account-actions";
import { PublicSearch } from "./public-search";
import { MobileDrawer } from "./mobile-drawer";

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 4h2l2 11h10l2-8H6" />
      <circle cx="9" cy="19" r="1.2" />
      <circle cx="17" cy="19" r="1.2" />
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
  return (
    <header className="public-header">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <MobileDrawer
        className="mobile-public-menu"
        drawerClassName="mobile-public-drawer"
        label="Open navigation"
      >
        {auth ? (
          <Link className="mobile-drawer-profile" href="/account/profile">
            <span className="avatar">
              {auth.user.name.slice(0, 1).toUpperCase()}
            </span>
            <strong>{auth.user.name}</strong>
            <small>{auth.user.email}</small>
            <em>
              {dashboard === "/admin" ? "Administrator" : "Student"}
            </em>
          </Link>
        ) : null}
        <nav className="mobile-drawer-nav" aria-label="Mobile primary navigation">
          <Link href="/">Home</Link>
          <Link className="mobile-drawer-cart" href="/cart">
            <span>Cart</span>
            <CartCount />
          </Link>
          <Link href="/packages">All packages</Link>
          {auth ? <Link href={dashboard}>Dashboard</Link> : null}
        </nav>
        <div className="mobile-drawer-actions">
          {auth ? (
            <LogoutButton />
          ) : (
            <>
              <Link className="button secondary" href="/login">
                Sign in
              </Link>
              <Link className="button" href="/signup">
                Create account
              </Link>
            </>
          )}
        </div>
      </MobileDrawer>
      <Brand />
      <PublicSearch />
      <nav className="desktop-public-nav" aria-label="Primary navigation">
        {desktopNavigation}
      </nav>
    </header>
  );
}
