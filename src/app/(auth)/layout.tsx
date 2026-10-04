import { AuthShell } from "@/features/auth/ui/auth-shell";
import { redirect } from "next/navigation";
import { getCurrentAuth } from "@/features/auth/authorization";
import { ADMIN_ROLE_KEYS } from "@/features/auth/constants";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const auth = await getCurrentAuth();
  if (auth) {
    const destination = auth.roles.some((role) => ADMIN_ROLE_KEYS.has(role))
      ? "/admin"
      : "/dashboard";
    redirect(destination);
  }
  return <AuthShell>{children}</AuthShell>;
}
