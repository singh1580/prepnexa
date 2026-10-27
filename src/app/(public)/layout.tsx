import Link from "next/link";
import { Brand } from "@/components/brand";
import { PublicHeader } from "@/components/public-header";
import { getCurrentAuth } from "@/features/auth/authorization";
import { ADMIN_ROLE_KEYS } from "@/features/auth/constants";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getCurrentAuth();
  const dashboard = auth?.roles.some((role) => ADMIN_ROLE_KEYS.has(role))
    ? "/admin"
    : "/dashboard";
  const supportHref = auth
    ? `${dashboard}/support`
    : "/login?next=%2Fdashboard%2Fsupport";
  const ordersHref = auth
    ? `${dashboard}/orders`
    : "/login?next=%2Fdashboard%2Forders";

  return (
    <div className="min-h-screen bg-white text-prep-ink">
      <PublicHeader auth={auth} />
      <div
        id="main-content"
        className="min-h-[calc(100vh-4.75rem)] bg-white"
        tabIndex={-1}
      >
        {children}
      </div>
      <footer className="public-footer grid grid-cols-[minmax(14rem,1.1fr)_minmax(0,3fr)] gap-12 border-t border-[#e6e3df] bg-white px-[clamp(1.25rem,4.5vw,4.5rem)] pt-[2.2rem] pb-4 text-[0.78rem] text-[#555d64] max-[800px]:grid-cols-1 max-[460px]:gap-8 [&_.brand-logo]:h-auto [&_.brand-logo]:w-[199px]">
        <div>
          <Brand />
          <p className="mt-[0.55rem] max-w-[22rem] leading-[1.6]">
            Quality study material for India&apos;s competitive exams.
          </p>
        </div>
        <nav
          className="grid grid-cols-4 gap-8 max-[800px]:grid-cols-2 max-[460px]:gap-6 [&>div]:grid [&>div]:content-start [&>div]:gap-[0.7rem] [&_a]:text-[#62696f] [&_a]:hover:text-[#d84311] [&_b]:text-[0.8rem] [&_b]:text-[#202327]"
          aria-label="Footer navigation"
        >
          <div>
            <b>Packages</b>
            <Link href="/packages">All packages</Link>
            <Link href="/packages?format=tests">Test series</Link>
            <Link href="/packages?format=pdf">Study material</Link>
            <Link href="/packages?sort=latest">New arrivals</Link>
          </div>
          <div>
            <b>Support</b>
            <Link href={supportHref}>Help centre</Link>
            <Link href="/contact">Contact us</Link>
            <Link href={ordersHref}>Order tracking</Link>
          </div>
          <div>
            <b>Legal</b>
            <Link href="/legal/terms">Terms of service</Link>
            <Link href="/legal/privacy">Privacy policy</Link>
            <Link href="/legal/cancellation-refund">
              Cancellation &amp; refund
            </Link>
            <Link href="/legal/fair-use">Fair use policy</Link>
          </div>
          <div>
            <b>Your account</b>
            {auth ? (
              <>
                <Link href={dashboard}>Dashboard</Link>
                {dashboard === "/dashboard" ? (
                  <>
                    <Link href="/dashboard/orders">My orders</Link>
                    <Link href="/dashboard/courses">My packages</Link>
                  </>
                ) : (
                  <Link href="/admin">Admin workspace</Link>
                )}
              </>
            ) : (
              <>
                <Link href="/login">Sign in</Link>
                <Link href="/signup">Create account</Link>
              </>
            )}
          </div>
        </nav>
        <small className="col-span-full border-t border-[#e1ded9] pt-6 text-prep-muted">
          © {new Date().getFullYear()} Prepstore. All rights reserved.
        </small>
      </footer>
    </div>
  );
}
