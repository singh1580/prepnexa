import Link from "next/link";
import { Brand } from "./brand";

const links = [
  { href: "/exams", label: "Exams" },
  { href: "/packages", label: "Packages" },
  { href: "/free-tests", label: "Free tests" },
  { href: "/login", label: "Sign in" },
];

function NavigationLinks() {
  return <>{links.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}<Link className="button small" href="/signup">Create account</Link></>;
}

export function PublicHeader() {
  return <header className="public-header">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <Brand />
    <nav className="desktop-public-nav" aria-label="Primary navigation"><NavigationLinks /></nav>
    <details className="mobile-public-menu">
      <summary>Menu</summary>
      <nav aria-label="Mobile primary navigation"><NavigationLinks /></nav>
    </details>
  </header>;
}
