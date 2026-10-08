import Link from "next/link";
import { Brand } from "@/components/brand";
import { PublicHeader } from "@/components/public-header";
import { getCurrentAuth } from "@/features/auth/authorization";
import { ADMIN_ROLE_KEYS } from "@/features/auth/constants";

export default async function Layout({ children }: { children: React.ReactNode }) {
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

  return <div className="public-site"><PublicHeader auth={auth}/><div id="main-content" tabIndex={-1}>{children}</div><footer className="public-footer"><div className="footer-brand"><Brand/><p>Quality study material for India&apos;s competitive exams.</p></div><nav aria-label="Footer navigation"><div><b>Packages</b><Link href="/packages">All packages</Link><Link href="/packages?format=tests">Test series</Link><Link href="/packages?format=pdf">Study material</Link><Link href="/packages?sort=latest">New arrivals</Link></div><div><b>Support</b><Link href={supportHref}>Help centre</Link><Link href={supportHref}>Contact us</Link><Link href={ordersHref}>Order tracking</Link><Link href="/legal/cancellation-refund">Refund policy</Link></div><div><b>Legal</b><Link href="/legal/terms">Terms of service</Link><Link href="/legal/privacy">Privacy policy</Link><Link href="/legal/cancellation-refund">Cancellation &amp; refund</Link><Link href="/legal/fair-use">Fair use policy</Link></div><div><b>Your account</b>{auth?<><Link href={dashboard}>Dashboard</Link>{dashboard==="/dashboard"?<><Link href="/dashboard/orders">My orders</Link><Link href="/dashboard/courses">My packages</Link></>:<Link href="/admin">Admin workspace</Link>}</>:<><Link href="/login">Sign in</Link><Link href="/signup">Create account</Link></>}</div></nav><small>© {new Date().getFullYear()} Prepstore. All rights reserved.</small></footer></div>;
}
