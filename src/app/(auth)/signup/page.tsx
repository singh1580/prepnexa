import { AuthForm } from "@/features/auth/ui/auth-form";
import { redirect } from "next/navigation";
import { getCurrentAuth } from "@/features/auth/authorization";
import { ADMIN_ROLE_KEYS } from "@/features/auth/constants";
export const metadata = { title: "Create account" };
export default async function Page() {
  const auth = await getCurrentAuth();
  if (auth) redirect(auth.roles.some(role => ADMIN_ROLE_KEYS.has(role)) ? "/admin" : "/dashboard");
  return <AuthForm mode="signup" />;
}
