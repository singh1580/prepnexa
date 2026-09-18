import { AuthForm } from "@/features/auth/ui/auth-form";
export const metadata = { title: "Reset password" };
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) { return <AuthForm mode="reset-password" token={(await searchParams).token} />; }

