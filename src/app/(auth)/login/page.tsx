import { AuthForm } from "@/features/auth/ui/auth-form";
export const metadata = { title: "Sign in" };
export default async function Page({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  return <AuthForm mode="login" expiredSession={(await searchParams).reason === "session"} />;
}

