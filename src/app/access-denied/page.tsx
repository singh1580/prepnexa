import Link from "next/link";
/* Text includes intentional contractions. */
/* eslint-disable react/no-unescaped-entities */
import { Brand } from "@/components/brand";
export const metadata = { title: "Access denied" };
export default function Page() { return <main className="state-page"><Brand /><div className="state-icon" aria-hidden="true">⊘</div><span className="eyebrow">ACCESS DENIED</span><h1>You don't have access to this page</h1><p>This workspace isn't available for your account. Return to your dashboard to continue.</p><Link className="button" href="/dashboard">Go to my dashboard</Link></main>; }
