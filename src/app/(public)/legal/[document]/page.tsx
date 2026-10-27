import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentAuth } from "@/features/auth/authorization";
import { ADMIN_ROLE_KEYS } from "@/features/auth/constants";
import {
  documents,
  LEGAL_EFFECTIVE_DATE,
  type DocumentKey,
} from "./legal-documents";

export function generateStaticParams() {
  return Object.keys(documents).map((document) => ({ document }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ document: string }>;
}) {
  const value = documents[(await params).document as DocumentKey];
  return { title: value?.title ?? "Legal", description: value?.intro };
}

export default async function Page({
  params,
}: {
  params: Promise<{ document: string }>;
}) {
  const document = documents[(await params).document as DocumentKey];
  if (!document) notFound();
  const auth = await getCurrentAuth();
  const supportHref = auth
    ? auth.roles.some((role) => ADMIN_ROLE_KEYS.has(role))
      ? "/admin/support"
      : "/dashboard/support"
    : "/login?next=%2Fdashboard%2Fsupport";

  return (
    <main className="mx-auto w-[min(58rem,calc(100%-2.5rem))] py-8 pb-20 max-[600px]:w-[min(calc(100%-2rem),58rem)]">
      <nav
        className="my-[0.2rem] mb-4 flex items-center gap-[0.55rem] text-[0.78rem] text-[#667078] [&_b]:text-[#202326]"
        aria-label="Breadcrumb"
      >
        <Link href="/">Home</Link>
        <span>›</span>
        <b>{document.title}</b>
      </nav>
      <header className="border-b border-[#e5e2de] py-12 pb-10 max-[600px]:pt-8">
        <span className="text-[.68rem] font-extrabold tracking-[.18em] text-prep-orange">
          PREPSTORE POLICIES
        </span>
        <h1 className="mt-[.7rem] mb-4 text-[clamp(2.25rem,5vw,4rem)] tracking-[-.045em]">
          {document.title}
        </h1>
        <p className="max-w-[46rem] text-[1.05rem] leading-[1.7] text-[#596066]">
          {document.intro}
        </p>
        <small className="text-prep-muted">
          Effective and last updated: {LEGAL_EFFECTIVE_DATE}
        </small>
      </header>
      <div className="grid gap-0">
        {document.sections.map((section) => (
          <section
            className="border-b border-[#ece9e5] py-8"
            key={section.title}
          >
            <h2 className="mt-0 mb-[.65rem] text-[1.2rem]">{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p
                className="mt-[.65rem] mb-0 leading-[1.75] text-[#555d63] first:mt-0"
                key={paragraph}
              >
                {paragraph}
              </p>
            ))}
            {"bullets" in section && section.bullets ? (
              <ul className="mt-[.8rem] mb-0 pl-[1.35rem] text-[#555d63] [&>li]:pl-[.2rem] [&>li]:leading-[1.7] [&>li+li]:mt-[.35rem]">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {"links" in section && section.links ? (
              <div className="mt-[.9rem] flex flex-wrap gap-x-5 gap-y-2 [&>a]:font-bold [&>a]:text-[#b9340b] [&>a]:underline-offset-[.2rem]">
                {section.links.map((link) =>
                  "external" in link && link.external ? (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <a key={link.href} href={link.href}>
                      {link.label}
                    </a>
                  ),
                )}
              </div>
            ) : null}
          </section>
        ))}
      </div>
      <aside className="mt-8 flex items-center justify-between gap-4 rounded-xl bg-[#fff3ec] px-[1.4rem] py-5 max-[600px]:flex-col max-[600px]:items-start">
        <strong>Need help with an account, payment or privacy request?</strong>
        <Link className="font-[750] text-prep-orange" href={supportHref}>
          Contact support
        </Link>
      </aside>
    </main>
  );
}
