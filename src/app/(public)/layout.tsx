import { PublicHeader } from "@/components/public-header";
import Link from "next/link";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
      <footer className="public-footer">
        <div className="footer-brand"><strong><span>Prep</span>store</strong><p>Focused digital preparation for serious learners.</p></div>
        <nav aria-label="Footer navigation"><div><b>Explore</b><Link href="/packages">All packages</Link></div><div><b>Account</b><Link href="/login">Sign in</Link><Link href="/signup">Create account</Link></div><div><b>Support</b><Link href="/login?next=%2Fdashboard%2Fsupport">Help centre</Link></div></nav>
        <small>© {new Date().getFullYear()} Prepstore. All rights reserved.</small>
      </footer>
    </>
  );
}
