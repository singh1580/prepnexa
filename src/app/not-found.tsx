import Link from "next/link";
import { Brand } from "@/components/brand";
export default function NotFound(){return <main className="state-page"><Brand /><div className="state-icon neutral" aria-hidden="true">404</div><span className="eyebrow">PAGE NOT FOUND</span><h1>This page isn&apos;t here</h1><p>The address may be incorrect, or the page may have moved.</p><Link className="button" href="/">Go to home</Link></main>}
