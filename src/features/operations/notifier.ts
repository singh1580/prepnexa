import { Resend } from "resend";
import { env } from "@/config/env";

export async function sendOperationsEmail(input: { deliveryId: string; to: string; name: string; title: string; body: string }) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) throw new Error("Email provider is not configured.");
  const { data, error } = await new Resend(env.RESEND_API_KEY).emails.send({
    from: env.EMAIL_FROM, to: input.to, subject: input.title,
    text: `Hello ${input.name},\n\n${input.body}\n\nOpen ${env.NEXT_PUBLIC_APP_URL}/dashboard/notifications to review this update.`,
  }, { headers: { "Idempotency-Key": `notification-${input.deliveryId}` } });
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}
