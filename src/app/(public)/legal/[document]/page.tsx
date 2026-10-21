import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentAuth } from "@/features/auth/authorization";
import { ADMIN_ROLE_KEYS } from "@/features/auth/constants";
import { documents, LEGAL_EFFECTIVE_DATE, type DocumentKey } from "./legal-documents";

export function generateStaticParams() {
  return Object.keys(documents).map((document) => ({ document }));
}

export async function generateMetadata({ params }: { params: Promise<{ document: string }> }) {
  const value = documents[(await params).document as DocumentKey];
  return { title: value?.title ?? "Legal", description: value?.intro };
}

export default async function Page({ params }: { params: Promise<{ document: string }> }) {
  const document = documents[(await params).document as DocumentKey];
  if (!document) notFound();
  const auth = await getCurrentAuth();
  const supportHref = auth
    ? auth.roles.some((role) => ADMIN_ROLE_KEYS.has(role)) ? "/admin/support" : "/dashboard/support"
    : "/login?next=%2Fdashboard%2Fsupport";

  return <main className="legal-page">
    <nav className="store-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>›</span><b>{document.title}</b></nav>
    <header><span className="eyebrow">PREPSTORE POLICIES</span><h1>{document.title}</h1><p>{document.intro}</p><small>Effective and last updated: {LEGAL_EFFECTIVE_DATE}</small></header>
    <div className="legal-sections">{document.sections.map((section) => <section key={section.title}>
      <h2>{section.title}</h2>
      {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      {"bullets" in section && section.bullets ? <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul> : null}
      {"links" in section && section.links ? <div className="legal-links">{section.links.map((link) => "external" in link && link.external
        ? <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
        : <a key={link.href} href={link.href}>{link.label}</a>)}</div> : null}
    </section>)}</div>
    <aside><strong>Need help with an account, payment or privacy request?</strong><Link href={supportHref}>Contact support</Link></aside>
  </main>;
}
