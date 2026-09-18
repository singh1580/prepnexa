"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en"><body><main><h1>Something went wrong</h1><p>Please try again. If the problem continues, contact support.</p><button onClick={reset}>Try again</button></main></body></html>;
}
