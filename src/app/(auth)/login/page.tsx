import { AuthForm } from "@/features/auth/ui/auth-form";
import { redirect } from "next/navigation";
import { getCurrentAuth } from "@/features/auth/authorization";
import { ADMIN_ROLE_KEYS } from "@/features/auth/constants";
export const metadata = { title: "Sign in" };
const internalPath = /^\/(?!\/)[^\\\u0000-\u001f]*$/;
export default async function Page({ searchParams }: { searchParams: Promise<{ reason?: string | string[]; next?: string | string[] }> }) {
  const auth = await getCurrentAuth();
  if (auth) redirect(auth.roles.some(role => ADMIN_ROLE_KEYS.has(role)) ? "/admin" : "/dashboard");
  const values = await searchParams;
  const requestedPath = typeof values.next === "string" ? values.next : "";
  const nextPath = internalPath.test(requestedPath) ? requestedPath : "/dashboard";
  return <AuthForm mode="login" expiredSession={values.reason === "session"} nextPath={nextPath} />;
}
