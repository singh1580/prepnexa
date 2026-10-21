import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logger";
import { hashIdentifier } from "@/features/auth/crypto";
import type { ContactInquiryInput } from "./validation";
import { countRecentContactInquiries, createContactInquiry, updateContactDelivery } from "./repository";
import { sendContactInquiryEmail } from "./notifier";

export async function submitContactInquiry(input: ContactInquiryInput, context: { userId?: string; ip?: string; requestId: string }) {
  if (input.website) return { accepted: true as const, reference: null };

  const ipHash = context.ip ? hashIdentifier(`contact:${context.ip}`) : null;
  const recent = await countRecentContactInquiries(input.email, ipHash, new Date(Date.now() - 60 * 60 * 1000));
  if (recent.email >= 3 || recent.ip >= 10) {
    throw new AppError("CONTACT_RATE_LIMITED", "Too many enquiries were submitted recently. Please wait before trying again.", 429);
  }

  const inquiry = await createContactInquiry({
    userId: context.userId,
    name: input.name,
    email: input.email,
    phone: input.phone,
    category: input.category,
    subject: input.subject,
    message: input.message,
    ipHash,
    requestId: context.requestId,
  });

  const delivery = await sendContactInquiryEmail(inquiry);
  try {
    await updateContactDelivery({
      id: inquiry.id,
      status: delivery.status,
      providerMessageId: delivery.providerMessageId,
      lastError: delivery.error,
    });
  } catch (error) {
    logger.error({ module: "contact", action: "delivery_status_update_failed", inquiryId: inquiry.id, error }, "Contact enquiry is stored, but delivery status could not be updated");
  }

  return { accepted: true as const, reference: `PS-${inquiry.id.slice(0, 8).toUpperCase()}` };
}

