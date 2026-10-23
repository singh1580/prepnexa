/* Email markup intentionally uses raw head/img elements for broad inbox compatibility. */
/* eslint-disable @next/next/no-head-element, @next/next/no-img-element */
import type { ReactNode } from "react";
import { BUSINESS_SUPPORT_EMAIL, BUSINESS_SUPPORT_PHONE } from "@/config/business";
import { env } from "@/config/env";

const colors = { orange: "#e84714", ink: "#191919", muted: "#646464", line: "#e7e2dc", canvas: "#f6f4f1", white: "#ffffff" };

function EmailLayout({ preview, title, eyebrow, children }: { preview: string; title: string; eyebrow: string; children: ReactNode }) {
  const logo = `${env.NEXT_PUBLIC_APP_URL}/brand/prepstore-logo@4x.png`;
  return <html lang="en" dir="ltr"><head><title>{title}</title></head><body style={{ margin: 0, padding: 0, backgroundColor: colors.canvas, fontFamily: "Arial, Helvetica, sans-serif", color: colors.ink }}>
    <div style={{ display: "none", maxHeight: 0, overflow: "hidden", opacity: 0 }}>{preview}</div>
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: colors.canvas }}><tbody><tr><td align="center" style={{ padding: "28px 12px" }}>
      <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ maxWidth: 600, backgroundColor: colors.white, border: `1px solid ${colors.line}`, borderRadius: 18, overflow: "hidden" }}><tbody>
        <tr><td style={{ padding: "24px 28px 20px", borderBottom: `3px solid ${colors.orange}` }}><img src={logo} width="166" alt="Prepstore" style={{ display: "block", width: 166, maxWidth: "100%", height: "auto" }}/></td></tr>
        <tr><td lang="en" dir="ltr" style={{ padding: "32px 28px 30px" }}>
          <p style={{ margin: "0 0 10px", color: colors.orange, fontSize: 12, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase" }}>{eyebrow}</p>
          <h1 style={{ margin: "0 0 18px", fontSize: 26, lineHeight: 1.25, color: colors.ink }}>{title}</h1>
          {children}
        </td></tr>
        <tr><td lang="en" dir="ltr" style={{ padding: "22px 28px", backgroundColor: "#fff8f4", borderTop: `1px solid ${colors.line}`, color: colors.muted, fontSize: 13, lineHeight: 1.6 }}>
          Need help? Email <a href={`mailto:${BUSINESS_SUPPORT_EMAIL}`} style={{ color: colors.orange }}>{BUSINESS_SUPPORT_EMAIL}</a> or call <a href={`tel:${BUSINESS_SUPPORT_PHONE.replaceAll(" ", "")}`} style={{ color: colors.orange }}>{BUSINESS_SUPPORT_PHONE}</a>.<br/>
          <span>Prepstore · Focused preparation, clearly organised.</span>
        </td></tr>
      </tbody></table>
    </td></tr></tbody></table>
  </body></html>;
}

const paragraph = { margin: "0 0 16px", color: colors.muted, fontSize: 16, lineHeight: 1.65 } as const;

export function VerificationOtpEmail({ name, code, expiresInMinutes }: { name: string; code: string; expiresInMinutes: number }) {
  return <EmailLayout preview={`Your Prepstore verification code is ${code}. It expires in ${expiresInMinutes} minutes.`} eyebrow="Account verification" title="Verify your email address">
    <p style={paragraph}>Hello {name},</p>
    <p style={paragraph}>Enter this one-time code on Prepstore to finish creating your account.</p>
    <div aria-label={`Verification code ${code}`} style={{ margin: "24px 0", padding: "18px 12px", border: `1px solid ${colors.line}`, borderRadius: 12, backgroundColor: "#fff8f4", color: colors.ink, textAlign: "center", fontFamily: "Courier New, monospace", fontSize: 32, fontWeight: 700, letterSpacing: "8px" }}>{code}</div>
    <p style={paragraph}>This code expires in <strong>{expiresInMinutes} minutes</strong>. Never share it with anyone, including someone claiming to be from Prepstore.</p>
    <p style={{ ...paragraph, marginBottom: 0 }}>If you did not create a Prepstore account, you can safely ignore this email.</p>
  </EmailLayout>;
}

export function PasswordResetEmail({ name, resetUrl, expiresInMinutes }: { name: string; resetUrl: string; expiresInMinutes: number }) {
  return <EmailLayout preview={`Reset your Prepstore password. This secure link expires in ${expiresInMinutes} minutes.`} eyebrow="Account security" title="Reset your password">
    <p style={paragraph}>Hello {name},</p>
    <p style={paragraph}>We received a request to reset your Prepstore password. Use the secure button below to choose a new password.</p>
    <table role="presentation" cellPadding="0" cellSpacing="0" style={{ margin: "24px 0" }}><tbody><tr><td style={{ borderRadius: 10, backgroundColor: colors.orange }}><a href={resetUrl} style={{ display: "inline-block", minHeight: 44, padding: "13px 22px", boxSizing: "border-box", color: colors.white, fontSize: 16, fontWeight: 700, textDecoration: "none" }}>Reset password</a></td></tr></tbody></table>
    <p style={paragraph}>This link expires in <strong>{expiresInMinutes} minutes</strong> and can be used only once.</p>
    <p style={{ ...paragraph, marginBottom: 8 }}>If the button does not work, copy this address into your browser:</p>
    <p style={{ margin: "0 0 18px", overflowWrap: "anywhere", fontSize: 13, lineHeight: 1.5 }}><a href={resetUrl} style={{ color: colors.orange }}>{resetUrl}</a></p>
    <p style={{ ...paragraph, marginBottom: 0 }}>If you did not request this reset, do not use the link. Your current password will remain unchanged.</p>
  </EmailLayout>;
}

export function NotificationEmail({ name, title, body }: { name: string; title: string; body: string }) {
  const notificationUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard/notifications`;
  return <EmailLayout preview={body.slice(0, 90)} eyebrow="Prepstore update" title={title}>
    <p style={paragraph}>Hello {name},</p>
    <p style={{ ...paragraph, whiteSpace: "pre-line" }}>{body}</p>
    <table role="presentation" cellPadding="0" cellSpacing="0" style={{ margin: "24px 0 0" }}><tbody><tr><td style={{ borderRadius: 10, backgroundColor: colors.orange }}><a href={notificationUrl} style={{ display: "inline-block", minHeight: 44, padding: "13px 22px", boxSizing: "border-box", color: colors.white, fontSize: 16, fontWeight: 700, textDecoration: "none" }}>View notification</a></td></tr></tbody></table>
  </EmailLayout>;
}

export function ContactInquiryEmail(input: { id: string; name: string; email: string; phone: string | null; category: string; subject: string; message: string }) {
  const rows = [["Reference", input.id], ["Category", input.category.replaceAll("_", " ")], ["Name", input.name], ["Email", input.email], ["Phone", input.phone ?? "Not provided"]];
  return <EmailLayout preview={`${input.name}: ${input.subject}`} eyebrow="Contact enquiry" title={input.subject}>
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: 22, border: `1px solid ${colors.line}`, borderRadius: 10 }}><tbody>{rows.map(([label, value]) => <tr key={label}><td style={{ padding: "10px 12px", width: 100, borderBottom: `1px solid ${colors.line}`, color: colors.muted, fontSize: 13 }}>{label}</td><td style={{ padding: "10px 12px", borderBottom: `1px solid ${colors.line}`, color: colors.ink, fontSize: 14, overflowWrap: "anywhere" }}>{value}</td></tr>)}</tbody></table>
    <p style={{ ...paragraph, whiteSpace: "pre-wrap", marginBottom: 0 }}>{input.message}</p>
  </EmailLayout>;
}
