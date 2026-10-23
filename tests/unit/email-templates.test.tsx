import { render } from "@react-email/render";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { NotificationEmail, PasswordResetEmail, VerificationOtpEmail } from "@/features/email/templates";

describe("Prepstore transactional email templates", () => {
  it("renders a branded, accessible OTP email without exposing a verification link", async () => {
    const html = await render(<VerificationOtpEmail name="Learner" code="482915" expiresInMinutes={10}/>);
    expect(html).toContain('lang="en"');
    expect(html).toContain('role="presentation"');
    expect(html).toContain("Prepstore");
    expect(html).toContain("482915");
    expect(html).toContain("10 minutes");
    expect(html).not.toContain("verify-email?token=");
  });

  it("renders secure reset and notification actions with absolute Prepstore URLs", async () => {
    const reset = await render(<PasswordResetEmail name="Learner" resetUrl="https://prepstore.in/reset-password?token=safe" expiresInMinutes={30}/>);
    const notification = await render(<NotificationEmail name="Learner" title="Package updated" body="New material is ready."/>);
    expect(reset).toContain("https://prepstore.in/reset-password?token=safe");
    expect(notification).toContain("/dashboard/notifications");
  });

  it("keeps the email provider isolated behind the shared sender", () => {
    for (const path of ["src/features/auth/notifier.tsx", "src/features/contact/notifier.tsx", "src/features/operations/notifier.tsx"]) {
      const source = readFileSync(path, "utf8");
      expect(source).toContain("sendTransactionalEmail");
      expect(source).not.toContain("new Resend");
      expect(source).not.toContain("emails.send");
    }
    expect(readFileSync("src/features/email/sender.ts", "utf8")).toContain("new Resend");
  });
});
