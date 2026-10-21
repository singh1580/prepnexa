import { Resend } from "resend";
import { BUSINESS_SUPPORT_EMAIL } from "@/config/business";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";

type InquiryMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  category: string;
  subject: string;
  message: string;
};

export async function sendContactInquiryEmail(input: InquiryMessage) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    logger.warn({ module: "contact", action: "email_skipped", inquiryId: input.id }, "Contact email provider is not configured");
    return { status: "NOT_CONFIGURED" as const, providerMessageId: null, error: "Email provider is not configured." };
  }

  try {
    const { data, error } = await new Resend(env.RESEND_API_KEY).emails.send({
      from: env.EMAIL_FROM,
      to: BUSINESS_SUPPORT_EMAIL,
      replyTo: input.email,
      subject: `[Prepstore contact · ${input.category.replaceAll("_", " ")}] ${input.subject}`,
      text: [
        `Contact enquiry ${input.id}`,
        `Category: ${input.category.replaceAll("_", " ")}`,
        `Name: ${input.name}`,
        `Email: ${input.email}`,
        `Phone: ${input.phone ?? "Not provided"}`,
        "",
        input.message,
      ].join("\n"),
    }, { headers: { "Idempotency-Key": `contact-${input.id}` } });
    if (error) throw new Error(error.message);
    return { status: "SENT" as const, providerMessageId: data?.id ?? null, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email delivery error";
    logger.error({ module: "contact", action: "email_failed", inquiryId: input.id, error }, "Contact email delivery failed");
    return { status: "FAILED" as const, providerMessageId: null, error: message };
  }
}

