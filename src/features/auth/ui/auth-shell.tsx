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
    <div className="auth-shell">
      <aside className="auth-story">
        <Brand />
        <div className="story-copy">
          <span className="eyebrow">PREPARATION, REFINED</span>
          <h1>
            Turn effort into
            <br />
            measurable progress.
          </h1>
          <p>
            Focused tests, organised material and meaningful analysis in one
            calm learning workspace.
          </p>
          <div className="auth-orbit" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </div>
        <p className="story-footer">PREPSTORE · LEARN WITH INTENT</p>
      </aside>
      <main id="main-content" className="auth-main">
        <Link className="auth-back-home" href="/">
          <BackArrowIcon />
          <span>Back to home</span>
        </Link>
        <div className="mobile-brand">
          <Brand />
        </div>
        <div className="auth-card">{children}</div>
        <footer className="auth-footer">
          Secure access to your Prepstore workspace.
        </footer>
      </main>
    </div>
  );
}
