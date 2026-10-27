import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const contactPage = readFileSync("src/app/(public)/contact/page.tsx", "utf8");
const publicLayout = readFileSync("src/app/(public)/layout.tsx", "utf8");
const publicHeader = readFileSync("src/components/public-header.tsx", "utf8");
const legalDocuments = readFileSync("src/app/(public)/legal/[document]/legal-documents.ts", "utf8");
const contactForm = readFileSync("src/features/contact/ui/contact-form.tsx", "utf8");
const contactRoute = readFileSync("src/app/api/contact/route.ts", "utf8");
const authForm = readFileSync("src/features/auth/ui/auth-form.tsx", "utf8");

describe("contact and support routing", () => {
  it("keeps Contact us separate from the authenticated Help Centre", () => {
    expect(publicLayout).toContain('<Link href={supportHref}>Help centre</Link>');
    expect(publicLayout).toContain('<Link href="/contact">Contact us</Link>');
    expect(publicHeader).toContain('<Link href="/contact">Contact</Link>');
    expect(contactPage).toContain('"/dashboard/support"');
    expect(contactPage).toContain('"/admin/support"');
    expect(contactPage).toContain('"/login?next=%2Fdashboard%2Fsupport"');
  });

  it("publishes verified contact channels and a separate enquiry form", () => {
    expect(contactPage).toContain("BUSINESS_SUPPORT_EMAIL");
    expect(contactPage).toContain("BUSINESS_SUPPORT_PHONE_E164");
    expect(contactPage).toContain("BUSINESS_ADDRESS");
    expect(contactPage).not.toContain("NewSupportTicketForm");
    expect(contactPage).toContain("<ContactForm");
    expect(contactForm).toContain('fetch("/api/contact"');
    expect(contactRoute).toContain("contactInquirySchema.parse");
    expect(contactPage).not.toContain("LEGAL OPERATOR");
    expect(contactPage).not.toContain("BUSINESS_ENTITY_TYPE");
    expect(publicLayout).toContain('href="/legal/fair-use"');
  });

  it("requires all four policies during account registration", () => {
    expect(authForm).toContain('name="acceptPolicies"');
    expect(authForm).toContain('href="/legal/terms"');
    expect(authForm).toContain('href="/legal/privacy"');
    expect(authForm).toContain('href="/legal/cancellation-refund"');
    expect(authForm).toContain('href="/legal/fair-use"');
  });

  it("uses the approved Prepstore casing throughout every legal document", () => {
    expect(legalDocuments).toContain("Prepstore");
    expect(legalDocuments).not.toContain("PrepStore");
  });
});
