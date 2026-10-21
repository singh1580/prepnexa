import { describe, expect, it } from "vitest";
import { contactInquirySchema } from "../../src/features/contact/validation";

describe("contact enquiry validation", () => {
  const valid = {
    name: "Learner Name",
    email: " learner@example.com ",
    phone: "",
    category: "PRIVACY",
    subject: "Privacy request",
    message: "Please help me review the personal data linked to my account.",
    website: "",
  };

  it("normalizes valid public enquiries", () => {
    expect(contactInquirySchema.parse(valid)).toMatchObject({ email: "learner@example.com", phone: null, category: "PRIVACY" });
  });

  it("rejects unsupported categories and short messages", () => {
    expect(() => contactInquirySchema.parse({ ...valid, category: "PAYMENT" })).toThrow();
    expect(() => contactInquirySchema.parse({ ...valid, message: "Too short" })).toThrow();
  });
});
