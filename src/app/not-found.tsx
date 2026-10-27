import Link from "next/link";
import { Brand } from "@/components/brand";
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-8 py-24 text-center">
      <div className="absolute top-8 left-8">
        <Brand />
      </div>
      <div
        className="mb-5 text-[3.5rem] font-extrabold text-prep-orange"
        aria-hidden="true"
      >
        404
      </div>
      <span className="eyebrow">PAGE NOT FOUND</span>
      <h1 className="my-3 max-w-[45rem] text-[clamp(2.2rem,5vw,4rem)] tracking-[-.05em]">
        This page isn&apos;t here
      </h1>
      <p className="mb-5 max-w-[35rem] leading-[1.7] text-prep-muted">
        The address may be incorrect, or the page may have moved.
      </p>
      <Link
        className="inline-flex min-h-11 items-center justify-center rounded-prep-control bg-prep-orange px-5 font-bold text-white hover:bg-prep-orange-dark"
        href="/"
      >
        Go to home
      </Link>
    </main>
  );
}
