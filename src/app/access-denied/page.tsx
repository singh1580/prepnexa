import Link from "next/link";
import { Brand } from "@/components/brand";
export const metadata = {
  title: "Access denied",
  robots: { index: false, follow: false, nocache: true },
};
export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-8 py-24 text-center">
      <div className="absolute top-8 left-8">
        <Brand />
      </div>
      <div
        className="mb-5 text-[3.5rem] font-extrabold text-prep-danger"
        aria-hidden="true"
      >
        ⊘
      </div>
      <span className="eyebrow">ACCESS DENIED</span>
      <h1 className="my-3 max-w-[45rem] text-[clamp(2.2rem,5vw,4rem)] tracking-[-.05em]">
        You don&apos;t have access to this page
      </h1>
      <p className="mb-5 max-w-[35rem] leading-[1.7] text-prep-muted">
        This workspace isn&apos;t available for your account. Return to your
        dashboard to continue.
      </p>
      <Link
        className="inline-flex min-h-11 items-center justify-center rounded-prep-control bg-prep-orange px-5 font-bold text-white hover:bg-prep-orange-dark"
        href="/dashboard"
      >
        Go to my dashboard
      </Link>
    </main>
  );
}
