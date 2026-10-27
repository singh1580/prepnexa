import Link from "next/link";
import { Brand } from "@/components/brand";

function BackArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m15 18-6-6 6-6M9 12h10" />
    </svg>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-white min-[801px]:h-dvh min-[801px]:grid-cols-[minmax(25rem,44%)_1fr] min-[801px]:overflow-hidden">
      <aside className="relative hidden min-w-0 overflow-hidden bg-[linear-gradient(145deg,#fff9f3,#f0e4d8)] px-[clamp(2rem,5vw,5rem)] py-[2.3rem] text-prep-ink before:pointer-events-none before:absolute before:-right-20 before:top-1/2 before:block before:size-56 before:-translate-y-1/2 before:rounded-full before:border before:border-[#ef4d1820] before:shadow-[0_0_0_4rem_#ef4d1805,0_0_0_8rem_#ef4d1803] min-[801px]:flex min-[801px]:h-dvh min-[801px]:flex-col min-[801px]:justify-between [&_.brand-logo]:h-auto [&_.brand-logo]:w-[188px]">
        <Brand variant="compact" />
        <div className="relative z-[1] max-w-[34rem]">
          <span className="text-[0.72rem] font-[760] uppercase tracking-[0.16em] text-prep-orange-dark">
            PREPARATION, REFINED
          </span>
          <h1 className="my-[1.1rem] mb-6 text-[clamp(2.35rem,4.4vw,4.7rem)] leading-[1.05] font-bold tracking-[-0.045em] text-prep-ink">
            Turn effort into
            <br />
            measurable progress.
          </h1>
          <p className="max-w-[31rem] text-[1.05rem] leading-[1.75] text-[#6b6764]">
            Focused tests, organised material and meaningful analysis in one
            calm learning workspace.
          </p>
          <div className="mt-10 flex items-center gap-3" aria-hidden="true">
            <i className="block size-2 rounded-full bg-prep-orange" />
            <i className="block h-px w-14 bg-[#ef4d1850]" />
            <i className="block size-2 rounded-full border border-prep-orange bg-transparent" />
          </div>
        </div>
        <p className="relative z-[1] text-[0.72rem] font-[720] tracking-[0.15em] text-[#8a7467]">
          PREPSTORE · LEARN WITH INTENT
        </p>
      </aside>
      <main
        id="main-content"
        className="relative flex min-h-screen min-w-0 flex-col items-center justify-start overflow-x-hidden bg-white px-5 py-6 min-[801px]:h-dvh min-[801px]:min-h-0 min-[801px]:overflow-y-auto min-[801px]:px-8 min-[801px]:py-[clamp(1rem,3vh,2rem)]"
      >
        <Link
          className="mb-[0.65rem] inline-flex min-h-11 w-full max-w-[30rem] items-center gap-2 rounded-[9px] text-sm font-[720] text-[#454a4f] transition-colors hover:text-prep-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-prep-orange [&_svg]:size-[19px] [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2"
          href="/"
        >
          <BackArrowIcon />
          <span>Back to home</span>
        </Link>
        <div className="mb-6 w-full max-w-[30rem] min-[801px]:hidden [&_.brand-logo]:h-auto [&_.brand-logo]:w-[172px]">
          <Brand variant="mobile" />
        </div>
        <div className="w-full max-w-[30rem] [&>h1]:mt-3 [&>h1]:mb-[0.55rem] [&>h1]:text-[clamp(2rem,4vw,3rem)] [&>h1]:leading-[1.08] [&>h1]:font-bold [&>h1]:tracking-[-0.035em] [&>form]:mt-[1.7rem]">
          {children}
        </div>
        <footer className="mt-12 w-full max-w-[30rem] text-center text-[0.78rem] text-prep-muted">
          Secure access to your Prepstore workspace.
        </footer>
      </main>
    </div>
  );
}
