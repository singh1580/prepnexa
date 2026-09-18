import Link from "next/link";
import { Brand } from "@/components/brand";
export default function Unauthorized() { return <main className="state-page"><Brand /><div className="state-icon neutral" aria-hidden="true">◇</div><span className="eyebrow">SIGN IN REQUIRED</span><h1>Your workspace is protected</h1><p>Sign in to continue securely.</p><Link className="button" href="/login">Sign in</Link></main>; }
