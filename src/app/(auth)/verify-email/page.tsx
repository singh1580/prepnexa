import { EmailVerificationForm } from "@/features/auth/ui/email-verification-form";
import { env } from "@/config/env";
export const metadata = { title: "Verify email" };
export default async function Page({ searchParams }: { searchParams: Promise<{ email?: string; delivery?: string }> }) { const query=await searchParams;return <EmailVerificationForm initialEmail={query.email?.slice(0,320)} deliveryFailed={query.delivery==="failed"} expiresInMinutes={env.EMAIL_VERIFICATION_OTP_TTL_MINUTES}/>; }

