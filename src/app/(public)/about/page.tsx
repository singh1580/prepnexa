import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { BUSINESS_SUPPORT_EMAIL } from "@/config/business";
import { SITE_ORIGIN } from "@/config/site";

export const metadata: Metadata = {
  title: "About Prepstore",
  description:
    "Learn how Prepstore organises exam preparation packages, practice tests and study material for students in India.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Prepstore",
    description:
      "Prepstore brings structured study material and practice tests together in clear exam preparation packages.",
    url: "/about",
  },
};

const principles = [
  {
    title: "Clear package information",
    body: "Every published package explains its intended exam, included content, access period and price before checkout.",
  },
  {
    title: "Structured learning access",
    body: "Purchased packages are organised in the student dashboard so tests and study material remain easy to find.",
  },
  {
    title: "Moderated public feedback",
    body: "Only eligible learners can submit package reviews, and public reviews are checked before publication.",
  },
] as const;

export default function AboutPage() {
  return (
    <main className="mx-auto w-[min(68rem,calc(100%-2.5rem))] py-8 pb-16 max-[600px]:w-[min(100%-2rem,68rem)] max-[600px]:pt-5">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "@id": `${SITE_ORIGIN}/about#webpage`,
          url: `${SITE_ORIGIN}/about`,
          name: "About Prepstore",
          description:
            "How Prepstore organises exam preparation packages, practice tests and study material.",
          isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
          about: { "@id": `${SITE_ORIGIN}/#organization` },
        }}
      />
      <nav
        className="mb-7 flex items-center gap-2 text-[0.78rem] text-prep-muted [&_b]:text-prep-ink"
        aria-label="Breadcrumb"
      >
        <Link href="/">Home</Link>
        <span aria-hidden="true">›</span>
        <b>About Prepstore</b>
      </nav>

      <section className="grid grid-cols-[minmax(0,1.25fr)_minmax(17rem,.75fr)] gap-12 border-b border-prep-line pb-12 max-[800px]:grid-cols-1 max-[800px]:gap-7">
        <div>
          <span className="text-[0.7rem] font-extrabold tracking-[0.16em] text-prep-orange">
            ABOUT PREPSTORE
          </span>
          <h1 className="mt-3 mb-5 max-w-[52rem] text-[clamp(2.35rem,5vw,4.6rem)] leading-[0.98] tracking-[-0.05em]">
            Focused preparation, organised in one place.
          </h1>
          <p className="m-0 max-w-[50rem] text-[clamp(1rem,1.5vw,1.16rem)] leading-[1.75] text-[#565d63]">
            Prepstore is an online learning platform for exam preparation
            packages in India. It brings practice tests and study material
            together so students can understand what a package contains,
            purchase access securely and continue learning from one dashboard.
          </p>
        </div>
        <aside className="self-end rounded-2xl border border-[#eadfd6] bg-[#fff7f2] p-6">
          <h2 className="mt-0 text-xl">What you can expect</h2>
          <p className="mb-0 leading-[1.7] text-[#5d6267]">
            Transparent package details, secure account access and a clear
            support path for account, payment or content questions.
          </p>
        </aside>
      </section>

      <section className="py-12">
        <h2 className="mt-0 mb-6 text-[clamp(1.7rem,3vw,2.4rem)] tracking-[-0.035em]">
          How Prepstore approaches quality
        </h2>
        <div className="grid grid-cols-3 gap-4 max-[800px]:grid-cols-1">
          {principles.map((principle, index) => (
            <article
              className="rounded-xl border border-prep-line bg-white p-6 shadow-[0_.35rem_1.2rem_rgba(40,28,18,.035)]"
              key={principle.title}
            >
              <span className="text-xs font-extrabold text-prep-orange">
                0{index + 1}
              </span>
              <h3 className="mt-3 mb-2 text-lg">{principle.title}</h3>
              <p className="m-0 leading-[1.65] text-[#60666b]">
                {principle.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-between gap-6 rounded-2xl bg-prep-ink px-7 py-6 text-white max-[650px]:flex-col max-[650px]:items-start">
        <div>
          <h2 className="m-0 text-xl">Need to reach Prepstore?</h2>
          <p className="mt-2 mb-0 text-[#d6d9dc]">
            Use the contact page or email {BUSINESS_SUPPORT_EMAIL}.
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-prep-orange px-5 font-bold text-white hover:bg-prep-orange-dark"
          href="/contact"
        >
          Contact us
        </Link>
      </section>
    </main>
  );
}
