import { AuthShell } from "@/features/auth/ui/auth-shell";
export default function Layout({ children }: { children: React.ReactNode }) { return <AuthShell>{children}</AuthShell>; }

