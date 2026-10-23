import { env } from "@/config/env";
import { sendTransactionalEmail } from "@/features/email/sender";
import { PasswordResetEmail, VerificationOtpEmail } from "@/features/email/templates";
import { logger } from "@/lib/logger";

async function deliver(kind: "verify" | "reset", action: () => Promise<string | null>) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    logger.warn({ module: "auth", action: "email_skipped", kind }, "Auth email provider is not configured");
    return false;
  }
  try {
    await action();
    return true;
  } catch (error) {
    logger.error({ module: "auth", action: "email_failed", kind, error }, "Auth email delivery failed");
    return false;
  }
}

export const authNotifier = {
  sendEmailVerification(input: { to: string; name: string; code: string; deliveryId: string }) {
    return deliver("verify", () => sendTransactionalEmail({
      to: input.to,
      subject: "Your Prepstore email verification code",
      template: <VerificationOtpEmail name={input.name} code={input.code} expiresInMinutes={env.EMAIL_VERIFICATION_OTP_TTL_MINUTES}/>,
      idempotencyKey: `auth-verify-${input.deliveryId}`,
    }));
  },
  sendPasswordReset(input: { to: string; name: string; token: string }) {
    const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${encodeURIComponent(input.token)}`;
    return deliver("reset", () => sendTransactionalEmail({
      to: input.to,
      subject: "Reset your Prepstore password",
      template: <PasswordResetEmail name={input.name} resetUrl={resetUrl} expiresInMinutes={env.PASSWORD_RESET_TTL_MINUTES}/>,
      idempotencyKey: `auth-reset-${input.token.slice(0, 24)}`,
    }));
  },
};
