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
      <footer className="public-footer grid grid-cols-[minmax(14rem,1.1fr)_minmax(0,3fr)] gap-12 border-t border-[#e6e3df] bg-white px-[clamp(1.25rem,4.5vw,4.5rem)] pt-[2.2rem] pb-4 text-[0.78rem] text-[#555d64] max-[800px]:grid-cols-1 max-[460px]:gap-8">
        <div>
          <Brand variant="footer" />
          <p className="mt-[0.55rem] max-w-[22rem] leading-[1.6]">
            Quality study material for India&apos;s competitive exams.
          </p>
          <a
            className="mt-4 inline-grid size-10 place-items-center rounded-full border border-[#dedad5] text-[#34383c] transition-colors hover:border-prep-orange hover:bg-[#fff4ef] hover:text-prep-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-prep-orange"
            href="https://www.instagram.com/prepstore.in/?hl=en"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Prepstore on Instagram"
            title="Instagram"
          >
            <svg
              aria-hidden="true"
              className="size-[1.15rem]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.4" cy="6.6" r="0.8" fill="currentColor" stroke="none" />
            </svg>
          </a>
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
            <Link href="/about">About Prepstore</Link>
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
