import { render, toPlainText } from "@react-email/render";
import type { ReactElement } from "react";
import { Resend } from "resend";
import { BUSINESS_SUPPORT_EMAIL } from "@/config/business";
import { env } from "@/config/env";

type TransactionalEmail = {
  to: string;
  subject: string;
  template: ReactElement;
  idempotencyKey: string;
  replyTo?: string;
};

export async function sendTransactionalEmail(input: TransactionalEmail) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) throw new Error("Email provider is not configured.");
  const html = await render(input.template);
  const text = toPlainText(html);
  const { data, error } = await new Resend(env.RESEND_API_KEY).emails.send({
    from: env.EMAIL_FROM,
    to: input.to,
    replyTo: input.replyTo ?? BUSINESS_SUPPORT_EMAIL,
    subject: input.subject,
    html,
    text,
  }, { headers: { "Idempotency-Key": input.idempotencyKey } });
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}
