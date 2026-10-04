"use client";
import { useEffect } from "react";
import { Brand } from "@/components/brand";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <html lang="en"><body><main className="state-page"><Brand /><div className="state-icon neutral" aria-hidden="true">!</div><span className="eyebrow">TEMPORARY PROBLEM</span><h1>We couldn&apos;t load this page</h1><p>Please try again. If the problem continues, return later.</p><button className="button" onClick={reset}>Try again</button></main></body></html>;
}
