"use client";
import { useEffect } from "react";
import { Brand } from "@/components/brand";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center px-8 py-24 text-center">
          <div className="absolute top-8 left-8">
            <Brand />
          </div>
          <div
            className="mb-5 text-[3.5rem] font-extrabold text-prep-orange"
            aria-hidden="true"
          >
            !
          </div>
          <span className="eyebrow">TEMPORARY PROBLEM</span>
          <h1 className="my-3 max-w-[45rem] text-[clamp(2.2rem,5vw,4rem)] tracking-[-.05em]">
            We couldn&apos;t load this page
          </h1>
          <p className="mb-5 max-w-[35rem] leading-[1.7] text-prep-muted">
            Please try again. If the problem continues, return later.
          </p>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-prep-control bg-prep-orange px-5 font-bold text-white hover:bg-prep-orange-dark"
            onClick={reset}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
