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
      <Link href="/">Home</Link>
      <Link href="/packages">Packages</Link>
      <Link href="/contact">Contact</Link>
      <Link
        className="relative grid size-[2.1rem] place-items-center border-l border-[#ece8e4] hover:text-prep-orange [&>.cart-count]:absolute [&>.cart-count]:-top-[0.45rem] [&>.cart-count]:-right-[0.4rem] [&>.cart-count]:grid [&>.cart-count]:h-5 [&>.cart-count]:min-w-5 [&>.cart-count]:place-items-center [&>.cart-count]:rounded-full [&>.cart-count]:bg-prep-orange [&>.cart-count]:px-1 [&>.cart-count]:text-[0.62rem] [&>.cart-count]:font-extrabold [&>.cart-count]:text-white [&>svg]:w-[1.3rem] [&>svg]:fill-none [&>svg]:stroke-current [&>svg]:stroke-[1.65]"
        href="/cart"
      >
        <span className="sr-only">Cart</span>
        <CartIcon />
        <CartCount />
      </Link>
      {auth ? (
        <>
          <Link href={dashboard}>Dashboard</Link>
          <Link
            className="grid size-[2.15rem] place-items-center rounded-full bg-[#f1e9df] font-[750] text-[#4b3429]"
            href={dashboard}
            aria-label={`${auth.user.name} dashboard`}
          >
            {auth.user.name.slice(0, 1).toUpperCase()}
          </Link>
        </>
      ) : (
        <>
          <Link href="/login">Sign in</Link>
          <Link
            className="inline-flex min-h-[2.7rem] items-center justify-center rounded-[0.36rem] border border-prep-orange bg-prep-orange px-[1.2rem] py-[0.68rem] font-[680] text-white transition-colors hover:border-prep-orange-dark hover:bg-prep-orange-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-prep-orange"
            href="/signup"
          >
            Create account
          </Link>
        </>
      )}
    </>
  );
  return (
    <header className="public-header sticky top-0 z-[60] grid h-[72px] min-h-[72px] grid-cols-[auto_minmax(15rem,32rem)_auto] items-center justify-between gap-[clamp(1rem,3vw,3rem)] border-b border-prep-line bg-white px-[clamp(24px,2.2vw,32px)] text-prep-ink shadow-[0_0.2rem_0.75rem_#3f2b1d09] max-[1099px]:h-16 max-[1099px]:min-h-16 max-[1099px]:grid-cols-[44px_minmax(0,1fr)_44px] max-[1099px]:justify-normal max-[1099px]:gap-1 max-[1099px]:overflow-visible max-[1099px]:px-[clamp(12px,2vw,16px)] max-[640px]:h-[60px] max-[640px]:min-h-[60px] max-[340px]:h-[58px] max-[340px]:min-h-[58px] max-[340px]:px-[clamp(10px,3vw,12px)] [&>.brand]:shrink-0 [&>.brand]:max-[1099px]:justify-self-center [&>.brand-logo-link]:w-[199px] [&>.brand-logo-link]:min-w-[199px] [&>.brand-logo-link]:max-[1099px]:w-[188px] [&>.brand-logo-link]:max-[1099px]:min-w-[188px] [&>.brand-logo-link]:max-[340px]:w-[177px] [&>.brand-logo-link]:max-[340px]:min-w-[177px] [&>.brand-logo-link_.brand-logo]:h-9 [&>.brand-logo-link_.brand-logo]:w-[199px] [&>.brand-logo-link_.brand-logo]:max-[1099px]:h-[34px] [&>.brand-logo-link_.brand-logo]:max-[1099px]:w-[188px] [&>.brand-logo-link_.brand-logo]:max-[340px]:h-8 [&>.brand-logo-link_.brand-logo]:max-[340px]:w-[177px] [&>.public-live-search]:max-[1100px]:hidden">
      <a
        className="fixed top-3 left-3 z-[1000] -translate-y-[180%] rounded-lg bg-prep-ink px-4 py-3 font-extrabold text-white focus:translate-y-0"
        href="#main-content"
      >
        Skip to main content
      </a>
      <MobileDrawer
        className="mobile-public-menu order-1"
        drawerClassName="mobile-public-drawer"
        label="Open navigation"
        variant="public"
      >
        {auth ? (
          <Link
            className="mb-1.5 flex flex-col items-center border-b border-[#ebe7e2] px-2 pb-[9px] text-center text-prep-ink"
            href="/account/profile"
          >
            <span className="mb-[5px] grid size-10 place-items-center rounded-full bg-[#fff0e8] text-base font-extrabold text-[#bd3d13]">
              {auth.user.name.slice(0, 1).toUpperCase()}
            </span>
            <strong className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-[15px] leading-[1.3] font-[760] text-[#24272a]">
              {auth.user.name}
            </strong>
            <small className="mt-[3px] w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs leading-[1.35] text-[#777d82]">
              {auth.user.email}
            </small>
            <em className="mt-[5px] rounded-full bg-[#fff2eb] px-2 py-[3px] text-[11px] font-[750] tracking-[0.03em] text-[#b83c14] not-italic">
              {dashboard === "/admin" ? "Administrator" : "Student"}
            </em>
          </Link>
        ) : null}
        <nav
          className="grid w-full min-w-0 items-stretch justify-stretch gap-0.5 text-prep-ink [&>a]:flex [&>a]:min-h-11 [&>a]:w-full [&>a]:min-w-0 [&>a]:items-center [&>a]:justify-start [&>a]:rounded-[9px] [&>a]:px-3 [&>a]:py-[9px] [&>a]:text-left [&>a]:text-[15px] [&>a]:font-bold [&>a]:text-[#36393d] [&>a]:hover:bg-[#fff3ed] [&>a]:hover:text-prep-orange"
          aria-label="Mobile primary navigation"
        >
          <Link href="/">Home</Link>
          <Link
            className="[&_.cart-count]:ml-2 [&_.cart-count]:grid [&_.cart-count]:size-[22px] [&_.cart-count]:place-items-center [&_.cart-count]:rounded-full [&_.cart-count]:bg-prep-orange [&_.cart-count]:text-[11px] [&_.cart-count]:text-white"
            href="/cart"
          >
            <span>Cart</span>
            <CartCount />
          </Link>
          <Link href="/packages">All packages</Link>
          <Link href="/contact">Contact us</Link>
          {auth ? <Link href={dashboard}>Dashboard</Link> : null}
        </nav>
        <div className="mt-2.5 grid gap-[9px] border-t border-[#ebe7e2] pt-3 [&_a]:flex [&_a]:min-h-[46px] [&_a]:w-full [&_a]:items-center [&_a]:justify-center [&_a]:rounded-prep-control [&_a]:border [&_a]:border-prep-orange [&_a]:bg-prep-orange [&_a]:px-4 [&_a]:font-bold [&_a]:text-white">
          {auth ? (
            <LogoutButton />
          ) : (
            <>
              <Link
                className="border-[#d9d7d3] bg-white text-[#34383c]"
                href="/login"
              >
                Sign in
              </Link>
              <Link href="/signup">Create account</Link>
            </>
          )}
        </div>
      </MobileDrawer>
      <Brand />
      <PublicSearch variant="public" />
      <nav
        className="flex items-center gap-[1.35rem] text-[0.82rem] font-[620] text-[#555961] max-[1099px]:hidden [&>a:not(:last-child)]:hover:text-prep-orange"
        aria-label="Primary navigation"
      >
        {desktopNavigation}
      </nav>
    </header>
  );
}
