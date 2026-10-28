import { AuthShell } from "@/features/auth/ui/auth-shell";
import { redirect } from "next/navigation";
import { getCurrentAuth } from "@/features/auth/authorization";
import { ADMIN_ROLE_KEYS } from "@/features/auth/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

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
