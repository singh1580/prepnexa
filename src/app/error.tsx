"use client";
import { Brand } from "@/components/brand";
export default function ErrorPage({reset}:{error:Error & {digest?:string};reset:()=>void}){return <main className="state-page"><Brand /><div className="state-icon neutral" aria-hidden="true">!</div><span className="eyebrow">TEMPORARY PROBLEM</span><h1>Something went wrong</h1><p>The problem has been recorded. Try this page again.</p><button className="button" onClick={reset}>Try again</button></main>}
