import { describe, expect, it } from "vitest";
import {
  documents,
  LEGAL_BUSINESS_ADDRESS,
  LEGAL_CONTACT_EMAIL,
  LEGAL_CONTACT_PHONE,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_GRIEVANCE_OFFICER,
  LEGAL_OWNER_NAME,
} from "../../src/app/(public)/legal/[document]/legal-documents";

describe("legal documents", () => {
  it("publishes every legal page with the verified contact and current date", () => {
    expect(Object.keys(documents)).toEqual([
      "terms",
      "privacy",
      "cancellation-refund",
      "fair-use",
    ]);
    expect(LEGAL_CONTACT_EMAIL).toBe("contactprepstore@gmail.com");
    expect(LEGAL_CONTACT_PHONE).toBe("+91 92342 26605");
    expect(LEGAL_BUSINESS_ADDRESS).toBe(
      "Salt Lake Sector V, Kolkata, West Bengal 700091, India",
    );
    expect(LEGAL_OWNER_NAME).toBe("Sunil Singh");
    expect(LEGAL_GRIEVANCE_OFFICER).toBe("Sanjeev Kumar");
    expect(LEGAL_EFFECTIVE_DATE).toBe("21 October 2026");

    for (const document of Object.values(documents)) {
      expect(document.sections.length).toBeGreaterThanOrEqual(12);
      expect(JSON.stringify(document)).toContain(LEGAL_CONTACT_EMAIL);
      expect(JSON.stringify(document)).not.toMatch(/\[(legal entity|complete address|support email|dd month|city, state)/i);
    }
  });

  it("keeps statutory grievance timing and escalation visible", () => {
    const terms = JSON.stringify(documents.terms);
    const refunds = JSON.stringify(documents["cancellation-refund"]);
    expect(terms).toContain("acknowledged within 48 hours");
    expect(terms).toContain("resolved within one month");
    expect(terms).toContain("https://consumerhelpline.gov.in/");
    expect(refunds).toContain("https://consumerhelpline.gov.in/");
  });
});
