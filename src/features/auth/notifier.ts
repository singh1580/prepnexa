import { Resend } from "resend";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";

type AuthMessage = { to: string; name: string; token: string };

async function send(input: AuthMessage, kind: "verify" | "reset") {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    logger.warn({ module: "auth", action: "email_skipped", kind }, "Auth email provider is not configured");
    return false;
  }
  const path = kind === "verify" ? "verify-email" : "reset-password";
  const link = `${env.NEXT_PUBLIC_APP_URL}/${path}?token=${encodeURIComponent(input.token)}`;
  const subject = kind === "verify" ? "Verify your email" : "Reset your password";
  const action = kind === "verify" ? "verify your email address" : "reset your password";
  try {
    const { error } = await new Resend(env.RESEND_API_KEY).emails.send({
      from: env.EMAIL_FROM,
      to: input.to,
      subject,
      text: `Hello ${input.name},\n\nUse this link to ${action}:\n${link}\n\nIf you did not request this, you can ignore this email.`,
    }, { headers: { "Idempotency-Key": `auth-${kind}-${input.token.slice(0, 24)}` } });
    if (error) throw new Error(error.message);
    return true;
  } catch (error) {
    logger.error({ module: "auth", action: "email_failed", kind, error }, "Auth email delivery failed");
    return false;
  }
}

export const authNotifier = {
  sendEmailVerification: (input: AuthMessage) => send(input, "verify"),
  sendPasswordReset: (input: AuthMessage) => send(input, "reset"),
};
