import { Overview } from "@/features/account/overview";
import { requireWorkspace } from "@/features/auth/page-access";
import { redirect } from "next/navigation";
export const metadata = { title: "Student workspace" };
export default async function Page() { const auth = await requireWorkspace(); if (auth.admin) redirect("/admin"); return <Overview />; }
