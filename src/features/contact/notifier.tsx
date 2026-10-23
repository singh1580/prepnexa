import { BUSINESS_SUPPORT_EMAIL } from "@/config/business";
import { env } from "@/config/env";
import { sendTransactionalEmail } from "@/features/email/sender";
import { ContactInquiryEmail } from "@/features/email/templates";
import { logger } from "@/lib/logger";

type InquiryMessage = { id: string; name: string; email: string; phone: string | null; category: string; subject: string; message: string };

export async function sendContactInquiryEmail(input: InquiryMessage) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    logger.warn({ module: "contact", action: "email_skipped", inquiryId: input.id }, "Contact email provider is not configured");
    return { status: "NOT_CONFIGURED" as const, providerMessageId: null, error: "Email provider is not configured." };
  }
  try {
    const providerMessageId = await sendTransactionalEmail({
      to: BUSINESS_SUPPORT_EMAIL,
      replyTo: input.email,
      subject: `[Prepstore contact · ${input.category.replaceAll("_", " ")}] ${input.subject}`,
      template: <ContactInquiryEmail {...input}/>,
      idempotencyKey: `contact-${input.id}`,
    });
    return { status: "SENT" as const, providerMessageId, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email delivery error";
    logger.error({ module: "contact", action: "email_failed", inquiryId: input.id, error }, "Contact email delivery failed");
    return { status: "FAILED" as const, providerMessageId: null, error: message };
  }
}
