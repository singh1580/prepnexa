import { AuthForm } from "@/features/auth/ui/auth-form";
export const metadata = { title: "Verify email" };
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) { return <AuthForm mode="verify-email" token={(await searchParams).token} />; }

