import Link from "next/link";
import { Brand } from "@/components/brand";
export default function Forbidden() { return <main className="state-page"><Brand /><div className="state-icon" aria-hidden="true">⊘</div><span className="eyebrow">ACCESS DENIED</span><h1>You don&apos;t have access to this page</h1><p>Your account does not have the required permission.</p><Link className="button" href="/dashboard">Go to my dashboard</Link></main>; }
