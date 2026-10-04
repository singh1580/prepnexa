import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentAuth } from "@/features/auth/authorization";
import { ADMIN_ROLE_KEYS } from "@/features/auth/constants";

const documents = {
  terms: {
    title: "Terms of service",
    intro: "These terms govern access to Prepstore's digital learning packages, tests and study materials.",
    sections: [
      ["Accounts", "Keep your account details accurate and your password private. Access is personal and must not be shared or resold."],
      ["Digital access", "Purchased package access begins after payment confirmation and continues for the duration shown on the package and invoice."],
      ["Acceptable use", "Do not copy, redistribute, scrape, bypass access controls or misuse Prepstore content or services."],
      ["Service availability", "We may perform maintenance or make reasonable product changes while protecting active purchases and learner data."],
    ],
  },
  privacy: {
    title: "Privacy policy",
    intro: "This page explains the information Prepstore uses to provide accounts, purchases and learning services.",
    sections: [
      ["Information we use", "We process account details, order and payment references, learning progress, test responses, support messages and security records."],
      ["Why we use it", "Information is used to operate your account, fulfil purchases, show learning progress, prevent abuse and respond to support requests."],
      ["Service providers", "Limited information may be processed by infrastructure, email and payment providers only where needed to deliver the service."],
      ["Your choices", "You may update account details and contact support about correction or deletion requests, subject to legal and transaction-record obligations."],
    ],
  },
  "cancellation-refund": {
    title: "Cancellation and refund policy",
    intro: "Prepstore sells digital learning access. Refund eligibility depends on payment status, access and the circumstances of the request.",
    sections: [
      ["Before payment", "You can remove a package from the cart or leave checkout before payment is completed."],
      ["Failed or duplicate payment", "Contact support with the order reference. Verified failed, duplicate or incorrectly captured payments will be investigated."],
      ["After access starts", "Because digital content can be accessed immediately, a refund is not automatic after materials or tests have been used."],
      ["How to request help", "Open a support ticket from your account and include the order ID and a clear explanation. Any approved refund is returned through the original payment method."],
    ],
  },
  "fair-use": {
    title: "Fair use policy",
    intro: "Package access is intended for the individual learner who purchased or received it.",
    sections: [
      ["Personal learning", "You may view assigned materials, take tests and download content only where a download option is provided."],
      ["Not permitted", "Account sharing, bulk copying, redistribution, resale, automated extraction and attempts to defeat security controls are prohibited."],
      ["Protection", "We may restrict access while investigating unusual activity and will provide a support path when an account is affected."],
      ["Questions", "Contact support before using content in a way that is not clearly covered by your package access."],
    ],
  },
} as const;

type DocumentKey = keyof typeof documents;

export function generateStaticParams() {
  return Object.keys(documents).map((document) => ({ document }));
}

export async function generateMetadata({ params }: { params: Promise<{ document: string }> }) {
  const value = documents[(await params).document as DocumentKey];
  return { title: value?.title ?? "Legal" };
}

export default async function Page({ params }: { params: Promise<{ document: string }> }) {
  const document = documents[(await params).document as DocumentKey];
  if (!document) notFound();
  const auth = await getCurrentAuth();
  const supportHref = auth
    ? auth.roles.some((role) => ADMIN_ROLE_KEYS.has(role))
      ? "/admin/support"
      : "/dashboard/support"
    : "/login?next=%2Fdashboard%2Fsupport";
  return <main className="legal-page"><nav className="store-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>›</span><b>{document.title}</b></nav><header><span className="eyebrow">PREPSTORE POLICIES</span><h1>{document.title}</h1><p>{document.intro}</p><small>Last updated: 4 October 2026</small></header><div className="legal-sections">{document.sections.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}</div><aside><strong>Need help with an account or order?</strong><Link href={supportHref}>Contact support</Link></aside></main>;
}
