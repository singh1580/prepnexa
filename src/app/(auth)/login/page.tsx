import { AuthForm } from "@/features/auth/ui/auth-form";
export const metadata = { title: "Sign in" };
const internalPath = /^\/(?!\/)[^\\\u0000-\u001f]*$/;
export default async function Page({ searchParams }: { searchParams: Promise<{ reason?: string | string[]; next?: string | string[] }> }) {
  const values = await searchParams;
  const requestedPath = typeof values.next === "string" ? values.next : "";
  const nextPath = internalPath.test(requestedPath) ? requestedPath : "/dashboard";
  return <AuthForm mode="login" expiredSession={values.reason === "session"} nextPath={nextPath} />;
}
